import { Request, Response } from "express";
import { db } from "../../config/firebase.config";

const collectionPath = "variants";

export const getVariants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    if (!shopId) {
      res.status(400).json({ success: false, message: "Shop ID required" });
      return;
    }

    const snapshot = await db.collection(collectionPath).where("shopId", "==", shopId as string).get();
    res.status(200).json({ success: true, data: snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() })) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createVariant = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    data.createdAt = new Date();
    data.updatedAt = new Date();
    const docRef = await db.collection(collectionPath).add(data);
    res.status(201).json({ success: true, data: { id: docRef.id, ...data } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVariant = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    data.updatedAt = new Date();
    await db.collection(collectionPath).doc(req.params.id as string).update(data);
    res.status(200).json({ success: true, message: "Variant updated" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteVariant = async (req: Request, res: Response) => {
  try {
    await db.collection(collectionPath).doc(req.params.id as string).delete();
    res.status(200).json({ success: true, message: "Variant deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
