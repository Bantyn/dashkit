import { db } from '../../../config/firebase.config';
import { ISettingsRepository } from '../interfaces/setting-repository.interface';
import { IRoleRepository } from '../interfaces/role-repository.interface';
import { IFeatureRepository } from '../interfaces/feature-repository.interface';
import { IPlanRepository } from '../interfaces/plan-repository.interface';
import { IAdminRepository } from '../interfaces/admin-repository.interface';
import { INotificationTemplateRepository } from '../interfaces/notification-template-repository.interface';
import { ICounterRepository } from '../interfaces/counter-repository.interface';
import { ISystemMetaRepository } from '../interfaces/system-meta-repository.interface';

export class FirestoreSeederRepository implements 
  ISettingsRepository, IRoleRepository, IFeatureRepository, 
  IPlanRepository, IAdminRepository, INotificationTemplateRepository, 
  ICounterRepository, ISystemMetaRepository {

  // ISettingsRepository
  async getPlatformSettings() {
    const doc = await db.collection('platform_settings').doc('global').get();
    return doc.exists ? doc.data() : null;
  }
  async createPlatformSettings(settings: any) {
    await db.collection('platform_settings').doc('global').set(settings, { merge: true });
  }
  async updatePlatformSettings(settings: any) {
    await db.collection('platform_settings').doc('global').update(settings);
  }

  // IRoleRepository
  async getRoles() {
    const snap = await db.collection('roles').get();
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  }
  async getRole(id: string) {
    const doc = await db.collection('roles').doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }
  async createRole(role: any) {
    await db.collection('roles').doc(role.id || role.key).set(role, { merge: true });
  }
  async updateRole(id: string, role: any) {
    await db.collection('roles').doc(id).update(role);
  }

  // IFeatureRepository
  async getFeatures() {
    const snap = await db.collection('features').get();
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  }
  async createFeature(feature: any) {
    await db.collection('features').doc(feature.key || feature.id).set(feature, { merge: true });
  }
  async updateFeature(id: string, feature: any) {
    await db.collection('features').doc(id).update(feature);
  }

  // IPlanRepository
  async getPlans() {
    const snap = await db.collection('plans').get();
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  }
  async createPlan(plan: any) {
    await db.collection('plans').doc(plan.id || plan.name.toLowerCase().replace(/\s+/g, '-')).set(plan, { merge: true });
  }
  async updatePlan(id: string, plan: any) {
    await db.collection('plans').doc(id).update(plan);
  }
  async getPackages() {
    const snap = await db.collection('packages').get();
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  }
  async createPackage(pkg: any) {
    await db.collection('packages').doc(pkg.id || pkg.name.toLowerCase().replace(/\s+/g, '-')).set(pkg, { merge: true });
  }

  // IAdminRepository
  async getAdminByEmail(email: string) {
    const snap = await db.collection('users').where('email', '==', email).limit(1).get();
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  }
  async createAdmin(admin: any) {
    const id = admin.id || db.collection('users').doc().id;
    await db.collection('users').doc(id).set({ ...admin, id }, { merge: true });
  }
  async updateAdmin(id: string, admin: any) {
    await db.collection('users').doc(id).update(admin);
  }

  // INotificationTemplateRepository
  async getTemplates() {
    const snap = await db.collection('notification_templates').get();
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  }
  async createTemplate(template: any) {
    await db.collection('notification_templates').doc(template.id || template.type).set(template, { merge: true });
  }
  async updateTemplate(id: string, template: any) {
    await db.collection('notification_templates').doc(id).update(template);
  }

  // ICounterRepository
  async getCounters() {
    const snap = await db.collection('counters').get();
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  }
  async createCounter(counter: any) {
    await db.collection('counters').doc(counter.id || counter.type).set(counter, { merge: true });
  }
  async updateCounter(id: string, counter: any) {
    await db.collection('counters').doc(id).update(counter);
  }

  // ISystemMetaRepository
  async getSystemMeta() {
    const doc = await db.collection('system_meta').doc('core').get();
    return doc.exists ? doc.data() : null;
  }
  async createSystemMeta(meta: any) {
    await db.collection('system_meta').doc('core').set(meta, { merge: true });
  }
  async updateSystemMeta(meta: any) {
    await db.collection('system_meta').doc('core').update(meta);
  }
}
