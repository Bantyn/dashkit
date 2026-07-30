import { Request, Response } from "express";
import { db } from "../../config/firebase.config";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { customerCreditService } from "../customer-credit/customer-credit.service";

const COLLECTION = "return_requests";

export const createReturnRequest = asyncHandler(async (req: Request, res: Response) => {
  const returnData = req.body;
  const displayId = returnData.displayId || `SR-${Math.floor(1000 + Math.random() * 9000)}`;

  const docRef = await db.collection(COLLECTION).add({
    ...returnData,
    displayId,
    status: returnData.status || "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
    date: returnData.date ? new Date(returnData.date) : new Date(),
  });

  return sendSuccess(res, { id: docRef.id, displayId, ...returnData }, "Return request created successfully");
});

export const getReturnRequestsByShop = asyncHandler(async (req: Request, res: Response) => {
  const snapshot = await db.collection(COLLECTION).where("shopId", "==", String(req.params.shopId)).get();
  const returns = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));

  returns.sort((a: any, b: any) => {
    const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return timeB - timeA;
  });

  return sendSuccess(res, returns, "Return requests fetched successfully");
});

export const updateReturnStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  if (!status) return sendError(res, "Status is required", 400);

  const returnRef = db.collection(COLLECTION).doc(String(req.params.id));
  
  await db.runTransaction(async (transaction: FirebaseFirestore.Transaction) => {
    const returnSnap = (await transaction.get(returnRef)) as unknown as FirebaseFirestore.DocumentSnapshot;
    if (!returnSnap.exists) throw new Error("Return request not found");
    const returnData = returnSnap.data() as any;
    
    // Only adjust inventory if transition is to "approved" or "completed" from a non-approved/non-completed state
    const alreadyProcessed = returnData.status === "approved" || returnData.status === "completed";
    const transitioningToActive = status === "approved" || status === "completed";
    
    if (transitioningToActive && !alreadyProcessed) {
      const items = returnData.items || [];
      const inventoryQueries = items.map((item: any) =>
        db.collection("inventory")
          .where("shopId", "==", returnData.shopId)
          .where("productId", "==", item.productId)
          .where("variantSku", "==", item.variantSku || "")
          .limit(1)
      );

      const productRefs = items.map((item: any) => db.collection("products").doc(item.productId));

      const [inventorySnaps, productDocs] = await Promise.all([
        Promise.all(inventoryQueries.map((q: any) => transaction.get(q))),
        productRefs.length > 0 ? transaction.getAll(...productRefs) : Promise.resolve([])
      ]);

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const invSnap = inventorySnaps[i];
        
        let currentStock = 0;
        let invRef;
        
        if (!invSnap.empty) {
          const invDoc = invSnap.docs[0];
          invRef = invDoc.ref;
          currentStock = invDoc.data().currentStock || 0;
        } else {
          invRef = db.collection("inventory").doc();
        }

        const newStock = currentStock + item.quantity;
        
        // Update Inventory doc
        transaction.set(invRef, {
          id: invRef.id,
          shopId: returnData.shopId,
          productId: item.productId,
          variantSku: item.variantSku || "",
          currentStock: newStock,
          lowStockThreshold: 10,
          updatedAt: new Date()
        }, { merge: true });

        // Update product variant/stockQuantity doc
        const productDoc = productDocs.find(d => d.id === item.productId) as unknown as FirebaseFirestore.DocumentSnapshot;
        if (productDoc && productDoc.exists) {
          const productData = productDoc.data() as any;
          if (productData?.variants && Array.isArray(productData.variants)) {
            const updatedVariants = productData.variants.map((v: any) => {
              if (v.sku === item.variantSku) {
                return { ...v, stock: newStock };
              }
              return v;
            });
            transaction.update(productDoc.ref, {
              variants: updatedVariants,
              updatedAt: new Date()
            });
          } else {
            transaction.update(productDoc.ref, {
              stockQuantity: newStock,
              updatedAt: new Date()
            });
          }
        }

        // Record movement history
        const historyRef = db.collection("inventory_history").doc();
        transaction.set(historyRef, {
          id: historyRef.id,
          shopId: returnData.shopId,
          productId: item.productId,
          variantSku: item.variantSku || "",
          movementType: "sales_return",
          changeType: "addition",
          amount: item.quantity,
          previousStock: currentStock,
          newStock,
          quantityChanged: item.quantity,
          reason: `Sales Return Approved/Completed (${returnData.displayId || returnData.invoiceNumber})`,
          referenceId: returnRef.id,
          referenceType: "sales_return",
          createdAt: new Date(),
        });
      }
    }

    // Update return request status
    transaction.update(returnRef, {
      status,
      updatedAt: new Date(),
    });
  });

  return sendSuccess(res, null, "Return status updated successfully");
});

export const getReturnById = asyncHandler(async (req: Request, res: Response) => {
  const doc = await db.collection(COLLECTION).doc(String(req.params.id)).get();
  if (!doc.exists) return sendError(res, "Return request not found", 404);
  return sendSuccess(res, { id: doc.id, ...doc.data() }, "Return fetched successfully");
});

export const getRefundsByShop = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  
  // 1. Fetch return requests
  const returnSnapshot = await db.collection("return_requests").where("shopId", "==", shopId).get();
  const returnRefunds = returnSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    const data = doc.data();
    return {
      id: doc.id,
      date: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || data.date || Date.now()),
      customerName: data.customerName || "Customer",
      customerPhone: data.customerPhone || "",
      amount: data.refundAmount || 0,
      reason: data.reason || `Refund for return request ${data.displayId || doc.id}`,
      source: 'Sales Return',
      status: data.status || 'pending',
    };
  });

  // 2. Fetch customer credit debits
  const customerCredits = await customerCreditService.getCreditsByShop(shopId);
  const creditRefunds: any[] = [];
  customerCredits.forEach((data: any) => {
    const history = data.history || [];
    history.forEach((h: any, idx: number) => {
      if (h.type === 'debit') {
        creditRefunds.push({
          id: h.id || `${data.id}_h_${idx}`,
          date: h.date?.toDate ? h.date.toDate() : new Date(h.date || Date.now()),
          customerName: data.customerName || "Customer",
          customerPhone: data.customerPhone || "",
          amount: h.amount || 0,
          reason: h.reason || "Credit Deduction",
          source: 'Store Credit Wallet',
          status: 'completed',
        });
      }
    });
  });

  // 3. Combine and sort
  const allRefunds = [...returnRefunds, ...creditRefunds];
  allRefunds.sort((a, b) => b.date.getTime() - a.date.getTime());

  return sendSuccess(res, allRefunds, "Refunds fetched successfully");
});

export const sendReturnWhatsApp = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const doc = await db.collection(COLLECTION).doc(String(id)).get();
  if (!doc.exists) {
    return sendError(res, "Return request not found", 404);
  }
  
  const returnData = doc.data() as any;

  const phone = returnData.customerPhone?.replace(/\D/g, "");
  if (!phone) {
    return sendError(res, "No valid phone number for customer", 400);
  }

  const dateStr = returnData.createdAt
    ? (returnData.createdAt?.toDate ? returnData.createdAt.toDate() : new Date(returnData.createdAt)).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  const defaultMessage = `Hello {{customerName}},\n\nYour return request *{{displayId}}* has been updated.\nStatus: *{{status}}*\nDate: ${dateStr}\n\nThank you for shopping with us! 🛍️`;

  try {
    const { notificationSenderService } = await import("../../shared/utils/notification-sender.service");
    await notificationSenderService.sendTemplatedNotification(
      returnData.shopId,
      "whatsapp",
      "sales_return_update",
      phone,
      {
        customerName: returnData.customerName || "Customer",
        displayId: returnData.displayId || "",
        status: returnData.status || "Updated",
      },
      "",
      defaultMessage
    );
    return sendSuccess(res, null, "WhatsApp sent successfully");
  } catch (err: any) {
    return sendError(res, err.message || "Failed to send WhatsApp", 400);
  }
});

