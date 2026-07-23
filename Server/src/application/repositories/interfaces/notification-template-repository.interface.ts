export interface INotificationTemplateRepository {
  getTemplates(): Promise<any[]>;
  createTemplate(template: any): Promise<void>;
  updateTemplate(id: string, template: any): Promise<void>;
}
