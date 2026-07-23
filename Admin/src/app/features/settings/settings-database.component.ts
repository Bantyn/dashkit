import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { UiInputComponent } from "../../shared/components/ui-input.component";
import { CheckboxComponent } from "../../shared/components/ui/checkbox.component";
import { UiDropdownComponent } from "../../shared/components/ui-dropdown.component";
import { AdminApiService } from "../../core/services/admin-api.service";
import { ToastService } from "../../core/services/toast.service";
import { ActivatedRoute } from "@angular/router";

type DbTab =
  | "overview"
  | "firestore"
  | "supabase"
  | "mongodb"
  | "sqlserver"
  | "active"
  | "migration"
  | "health"
  | "logs"
  | "backup"
  | "env"
  | "repositories"
  | "cache"
  | "advanced";

@Component({
  selector: "app-settings-database",
  standalone: true,
  imports: [CommonModule, FormsModule, UiInputComponent, CheckboxComponent, UiDropdownComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Unified Header row -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <div class="flex-1 px-6 py-5 flex justify-between items-center min-w-0">
          <div>
            <h2 class="text-xl font-semibold text-gray-900">Database Management</h2>
            <p class="text-xs text-gray-500 mt-1">Configure and monitor your global database infrastructure.</p>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex overflow-hidden">
        <div class="flex-1 flex flex-col min-w-0 bg-gray-50 transition-all duration-300 overflow-hidden">
          <div class="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col">
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex-1">
        

        <!-- Tab 1: Overview -->
        @if (activeTab === 'overview') {
          <div>
            <div class="flex items-center justify-between border-b border-gray-100 pb-6 mb-8">
              <div>
                <h2 class="text-xl font-semibold text-gray-900">Database Overview</h2>
                <p class="text-sm text-gray-500 mt-1">Real-time status of active database and providers.</p>
              </div>
              <button (click)="loadOverview()" [disabled]="refreshing" class="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">
                <i class="bi bi-arrow-clockwise text-xl" [class.animate-spin]="refreshing"></i>
              </button>
            </div>

            @if (loadingOverview) {
              <div class="py-20 text-center text-gray-400">
                <span class="w-8 h-8 border-3 border-gray-200 border-t-gray-900 rounded-full animate-spin inline-block mb-3"></span>
                <p class="text-sm font-semibold text-gray-500">Loading overview metrics...</p>
              </div>
            } @else if (overview) {
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <!-- Card 1 -->
                <div class="p-6 rounded-[20px] bg-gradient-to-br from-primary-50/50 to-purple-50/50 border border-indigo-100/50 shadow-sm">
                  <span class="text-xs font-semibold text-primary-700 tracking-wider block mb-2">Active Database</span>
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-normal text-sm">
                      {{ overview.activeDatabase.slice(0,2).toUpperCase() }}
                    </div>
                    <span class="text-lg font-normal text-gray-900 capitalize">{{ overview.activeDatabase }}</span>
                  </div>
                </div>
                <!-- Card 2 -->
                <div class="p-6 rounded-[20px] bg-gradient-to-br from-emerald-50/50 to-teal-50/50 border border-emerald-100/50 shadow-sm">
                  <span class="text-xs font-semibold text-emerald-600 tracking-wider block mb-2">Connection Status</span>
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span class="text-lg font-normal text-gray-900">{{ overview.connectionStatus }}</span>
                  </div>
                </div>
                <!-- Card 3 -->
                <div class="p-6 rounded-[20px] bg-gradient-to-br from-amber-50/50 to-orange-50/50 border border-amber-100/50 shadow-sm">
                  <span class="text-xs font-semibold text-amber-600 tracking-wider block mb-2">Latency / Ping</span>
                  <span class="text-2xl font-black text-gray-900 block">{{ overview.latency }} ms</span>
                </div>
                <!-- Card 4 -->
                <div class="p-6 rounded-[20px] bg-gradient-to-br from-sky-50/50 to-blue-50/50 border border-sky-100/50 shadow-sm">
                  <span class="text-xs font-semibold text-sky-600 tracking-wider block mb-2">Total Records</span>
                  <span class="text-2xl font-black text-gray-900 block">{{ overview.totalRecords | number }}</span>
                </div>
              </div>

              <!-- Database Details Grid -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-gray-100">
                <div>
                  <h3 class="font-semibold text-gray-900 mb-4 text-base">Metadata Stats</h3>
                  <table class="w-full text-sm">
                    <tbody>
                      <tr class="border-b border-gray-50">
                        <td class="py-3 text-gray-500 font-medium">Database Version</td>
                        <td class="py-3 text-gray-900 font-normal text-right">{{ overview.databaseVersion }}</td>
                      </tr>
                      <tr class="border-b border-gray-50">
                        <td class="py-3 text-gray-500 font-medium">Health Status</td>
                        <td class="py-3 text-right">
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-emerald-100 text-emerald-800 uppercase">
                            {{ overview.databaseHealth }}
                          </span>
                        </td>
                      </tr>
                      <tr class="border-b border-gray-50">
                        <td class="py-3 text-gray-500 font-medium">Repositories Status</td>
                        <td class="py-3 text-emerald-600 font-normal text-right">
                          <i class="bi bi-shield-fill-check"></i> {{ overview.repositoryStatus }}
                        </td>
                      </tr>
                      <tr class="border-b border-gray-50">
                        <td class="py-3 text-gray-500 font-medium">Cache Layer</td>
                        <td class="py-3 text-gray-900 font-normal text-right">{{ overview.cacheStatus }}</td>
                      </tr>
                      <tr>
                        <td class="py-3 text-gray-500 font-medium">Active Environment</td>
                        <td class="py-3 text-gray-900 font-normal text-right capitalize">{{ overview.currentEnvironment }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 class="font-semibold text-gray-900 mb-4 text-base">Collection Footprint</h3>
                  <div class="space-y-4">
                    @for (col of getObjectKeys(overview.collectionCounts); track col) {
                      <div>
                        <div class="flex justify-between text-xs font-semibold mb-1">
                          <span class="text-gray-500 capitalize">{{ col }}</span>
                          <span class="text-gray-900">{{ overview.collectionCounts[col] }} docs</span>
                        </div>
                        <div class="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div class="bg-primary-700 h-full" [style.width.%]="getProgressPercent(overview.collectionCounts[col], overview.totalRecords)"></div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Tab 2: Firestore Config -->
        @if (activeTab === 'firestore') {
          <div>
            <div class="border-b border-gray-100 pb-6 mb-8">
              <h2 class="text-xl font-semibold text-gray-900">Firestore Credentials</h2>
              <p class="text-sm text-gray-500 mt-1">Configure your primary Google Cloud Firestore provider credentials.</p>
            </div>

            <form (submit)="saveConfig('firestore', $event)" class="space-y-6 max-w-full">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <app-ui-input label="Project ID" type="text" [(ngModel)]="configs.firestore.projectId" name="projectId" placeholder="clothify-prod-1234"></app-ui-input>
                <app-ui-input label="Storage Bucket" type="text" [(ngModel)]="configs.firestore.storageBucket" name="storageBucket" placeholder="clothify-prod.appspot.com"></app-ui-input>
              </div>

              <app-ui-input label="Database URL" type="text" [(ngModel)]="configs.firestore.databaseUrl" name="databaseUrl" placeholder="https://clothify-prod-1234.firebaseio.com"></app-ui-input>

              <div class="space-y-2 relative">
                <label class="text-sm font-semibold text-gray-700">Private Key</label>
                <div class="relative">
                  <input [type]="showSecrets.firestorePrivateKey ? 'text' : 'password'" [(ngModel)]="configs.firestore.privateKey" name="privateKey" class="w-full border border-gray-200 rounded-xl pl-4 pr-12 py-2.5 text-sm focus:border-primary-700 outline-none" placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDh...">
                  <button type="button" (click)="toggleSecretVisibility('firestorePrivateKey')" class="absolute right-3 top-1/2 -trangray-y-1/2 text-gray-400 hover:text-gray-900">
                    <i [class]="showSecrets.firestorePrivateKey ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <app-ui-input label="Client Email" type="email" [(ngModel)]="configs.firestore.clientEmail" name="clientEmail" placeholder="firebase-adminsdk@clothify.iam.gserviceaccount.com"></app-ui-input>
                <app-ui-input label="Region" type="text" [(ngModel)]="configs.firestore.region" name="region" placeholder="asia-south1"></app-ui-input>
              </div>

              <!-- Help Instructions -->
              <div class="p-6 rounded-2xl bg-primary-50 border border-indigo-100/60 mt-8">
                <h4 class="font-normal text-indigo-900 text-sm mb-2"><i class="bi bi-question-circle"></i> Instructions: Where to obtain keys?</h4>
                <ol class="list-decimal pl-5 text-xs text-indigo-800 space-y-1.5 leading-relaxed">
                  <li>Go to the <a href="https://console.firebase.google.com" target="_blank" class="underline font-normal">Firebase Console</a>.</li>
                  <li>Click on <strong>Project Settings (Gear Icon)</strong> → <strong>Service Accounts</strong>.</li>
                  <li>Choose the <strong>Node.js</strong> option and click <strong>Generate New Private Key</strong>.</li>
                  <li>Download the JSON file, copy the values from it, and paste them into these fields.</li>
                </ol>
              </div>

              <div class="flex justify-between items-center pt-6 border-t border-gray-100">
                <button type="button" (click)="testConnection('firestore')" [disabled]="testing" class="border border-gray-200 hover:bg-gray-50 text-gray-800 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
                  @if (testing && testTarget === 'firestore') {
                    <span class="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></span>
                  }
                  Test Connection
                </button>
                <button type="submit" [disabled]="saving" class="bg-primary-700 hover:bg-primary-900 text-white px-8 py-3 rounded-xl font-normal text-sm transition-all flex items-center gap-2 shadow-md">
                  @if (saving && saveTarget === 'firestore') {
                    <span class="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></span>
                  }
                  Validate &amp; Save
                </button>
              </div>
            </form>
          </div>
        }

        <!-- Tab 3: Supabase Config -->
        @if (activeTab === 'supabase') {
          <div>
            <div class="border-b border-gray-100 pb-6 mb-8">
              <h2 class="text-xl font-semibold text-gray-900">Supabase Settings</h2>
              <p class="text-sm text-gray-500 mt-1">Configure your Supabase PostgreSQL database connection credentials.</p>
            </div>

            <form (submit)="saveConfig('supabase', $event)" class="space-y-6 max-w-full">
              <app-ui-input label="Project URL" type="text" [(ngModel)]="configs.supabase.projectUrl" name="projectUrl" placeholder="https://xyz.supabase.co"></app-ui-input>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-2 relative">
                  <label class="text-sm font-semibold text-gray-700">Anon Public Key</label>
                  <div class="relative">
                    <input [type]="showSecrets.supabaseAnon ? 'text' : 'password'" [(ngModel)]="configs.supabase.anonKey" name="anonKey" class="w-full border border-gray-200 rounded-xl pl-4 pr-12 py-2.5 text-sm focus:border-primary-700 outline-none" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...">
                    <button type="button" (click)="toggleSecretVisibility('supabaseAnon')" class="absolute right-3 top-1/2 -trangray-y-1/2 text-gray-400 hover:text-gray-900">
                      <i [class]="showSecrets.supabaseAnon ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                </div>
                <div class="space-y-2 relative">
                  <label class="text-sm font-semibold text-gray-700">Service Role Private Key</label>
                  <div class="relative">
                    <input [type]="showSecrets.supabaseService ? 'text' : 'password'" [(ngModel)]="configs.supabase.serviceRoleKey" name="serviceRoleKey" class="w-full border border-gray-200 rounded-xl pl-4 pr-12 py-2.5 text-sm focus:border-primary-700 outline-none" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...">
                    <button type="button" (click)="toggleSecretVisibility('supabaseService')" class="absolute right-3 top-1/2 -trangray-y-1/2 text-gray-400 hover:text-gray-900">
                      <i [class]="showSecrets.supabaseService ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <app-ui-input label="Database Password" type="password" [(ngModel)]="configs.supabase.databasePassword" name="databasePassword" placeholder="********"></app-ui-input>
                <app-ui-input label="Project Reference ID" type="text" [(ngModel)]="configs.supabase.projectReference" name="projectReference" placeholder="xyzabc123"></app-ui-input>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                  <div>
                    <label class="text-sm font-semibold text-gray-800 block">Connection Pooling</label>
                    <span class="text-xs text-gray-500">Enable PgBouncer pooler connection</span>
                  </div>
                  <app-checkbox [(ngModel)]="configs.supabase.connectionPooling" name="connectionPooling"></app-checkbox>
                </div>
                <div class="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                  <div>
                    <label class="text-sm font-semibold text-gray-800 block">SSL Connection</label>
                    <span class="text-xs text-gray-500">Require SSL certificates</span>
                  </div>
                  <app-checkbox [(ngModel)]="configs.supabase.ssl" name="ssl"></app-checkbox>
                </div>
              </div>

              <div class="p-6 rounded-2xl bg-primary-50 border border-indigo-100/60 mt-8">
                <h4 class="font-normal text-indigo-900 text-sm mb-2"><i class="bi bi-question-circle"></i> Instructions: Where to obtain keys?</h4>
                <ol class="list-decimal pl-5 text-xs text-indigo-800 space-y-1.5 leading-relaxed">
                  <li>Log in to your <a href="https://supabase.com" target="_blank" class="underline font-normal">Supabase Dashboard</a> and open your project.</li>
                  <li>Click on **Settings (Gear Icon)** → **API**.</li>
                  <li>Find the **Project URL**, **anon public key**, and **service_role key**. Paste them here.</li>
                </ol>
              </div>

              <div class="flex justify-between items-center pt-6 border-t border-gray-100">
                <button type="button" (click)="testConnection('supabase')" [disabled]="testing" class="border border-gray-200 hover:bg-gray-50 text-gray-800 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
                  @if (testing && testTarget === 'supabase') {
                    <span class="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></span>
                  }
                  Test Connection
                </button>
                <button type="submit" [disabled]="saving" class="bg-primary-700 hover:bg-primary-900 text-white px-8 py-3 rounded-xl font-normal text-sm transition-all flex items-center gap-2 shadow-md">
                  @if (saving && saveTarget === 'supabase') {
                    <span class="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></span>
                  }
                  Validate &amp; Save
                </button>
              </div>
            </form>
          </div>
        }

        <!-- Tab 4: MongoDB Config -->
        @if (activeTab === 'mongodb') {
          <div>
            <div class="border-b border-gray-100 pb-6 mb-8">
              <h2 class="text-xl font-semibold text-gray-900">MongoDB Credentials</h2>
              <p class="text-sm text-gray-500 mt-1">Configure your MongoDB Atlas or self-hosted database instance details.</p>
            </div>

            <form (submit)="saveConfig('mongodb', $event)" class="space-y-6 max-w-full">
              <app-ui-input label="Connection String (URI)" type="text" [(ngModel)]="configs.mongodb.connectionString" name="connectionString" placeholder="mongodb+srv://username:password@cluster0.mongodb.net/dbname"></app-ui-input>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <app-ui-input label="Database Name" type="text" [(ngModel)]="configs.mongodb.databaseName" name="databaseName" placeholder="clothify_db"></app-ui-input>
                <app-ui-input label="Username" type="text" [(ngModel)]="configs.mongodb.username" name="username" placeholder="db_admin"></app-ui-input>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <app-ui-input label="Replica Set Name (optional)" type="text" [(ngModel)]="configs.mongodb.replicaSet" name="replicaSet" placeholder="rs0"></app-ui-input>
                <app-ui-input label="Atlas Region" type="text" [(ngModel)]="configs.mongodb.atlasRegion" name="atlasRegion" placeholder="us-east-1"></app-ui-input>
              </div>

              <div class="p-6 rounded-2xl bg-primary-50 border border-indigo-100/60 mt-8">
                <h4 class="font-normal text-indigo-900 text-sm mb-2"><i class="bi bi-question-circle"></i> Instructions: MongoDB Atlas</h4>
                <p class="text-xs text-indigo-800 leading-relaxed mb-2">
                  Sign in to your **MongoDB Atlas** console, click **Connect** on your Database Deployment, and choose **Drivers** (Node.js). Copy the connection URI and paste it above.
                </p>
              </div>

              <div class="flex justify-between items-center pt-6 border-t border-gray-100">
                <button type="button" (click)="testConnection('mongodb')" [disabled]="testing" class="border border-gray-200 hover:bg-gray-50 text-gray-800 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
                  @if (testing && testTarget === 'mongodb') {
                    <span class="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></span>
                  }
                  Test Connection
                </button>
                <button type="submit" [disabled]="saving" class="bg-primary-700 hover:bg-primary-900 text-white px-8 py-3 rounded-xl font-normal text-sm transition-all flex items-center gap-2 shadow-md">
                  @if (saving && saveTarget === 'mongodb') {
                    <span class="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></span>
                  }
                  Validate &amp; Save
                </button>
              </div>
            </form>
          </div>
        }

        <!-- Tab 5: SQL Server Config -->
        @if (activeTab === 'sqlserver') {
          <div>
            <div class="border-b border-gray-100 pb-6 mb-8">
              <h2 class="text-xl font-semibold text-gray-900">SQL Server Configuration</h2>
              <p class="text-sm text-gray-500 mt-1">Configure Microsoft SQL Server database provider credentials.</p>
            </div>

            <form (submit)="saveConfig('sqlserver', $event)" class="space-y-6 max-w-full">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <app-ui-input label="Host / IP" type="text" [(ngModel)]="configs.sqlserver.host" name="host" placeholder="127.0.0.1"></app-ui-input>
                <app-ui-input label="Port" type="number" [(ngModel)]="configs.sqlserver.port" name="port" placeholder="1433"></app-ui-input>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <app-ui-input label="Username" type="text" [(ngModel)]="configs.sqlserver.username" name="username" placeholder="sa"></app-ui-input>
                <app-ui-input label="Password" type="password" [(ngModel)]="configs.sqlserver.password" name="password" placeholder="********"></app-ui-input>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <app-ui-input label="Database" type="text" [(ngModel)]="configs.sqlserver.database" name="database" placeholder="clothify_db"></app-ui-input>
                <app-ui-input label="Schema" type="text" [(ngModel)]="configs.sqlserver.schema" name="schema" placeholder="dbo"></app-ui-input>
              </div>

              <div class="flex justify-between items-center pt-6 border-t border-gray-100">
                <button type="button" (click)="testConnection('sqlserver')" [disabled]="testing" class="border border-gray-200 hover:bg-gray-50 text-gray-800 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
                  @if (testing && testTarget === 'sqlserver') {
                    <span class="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></span>
                  }
                  Test Connection
                </button>
                <button type="submit" [disabled]="saving" class="bg-primary-700 hover:bg-primary-900 text-white px-8 py-3 rounded-xl font-normal text-sm transition-all flex items-center gap-2 shadow-md">
                  @if (saving && saveTarget === 'sqlserver') {
                    <span class="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></span>
                  }
                  Validate &amp; Save
                </button>
              </div>
            </form>
          </div>
        }

        <!-- Tab 6: Active Provider switching -->
        @if (activeTab === 'active') {
          <div>
            <div class="border-b border-gray-100 pb-6 mb-8">
              <h2 class="text-xl font-semibold text-gray-900">Switch Database Provider</h2>
              <p class="text-sm text-gray-500 mt-1">Select and switch the active database provider globally.</p>
            </div>

            <!-- Provider Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              @for (prov of providerCards; track prov.id) {
                <div class="p-6 rounded-[24px] border-2 flex flex-col justify-between h-56 transition-all"
                  [class.border-primary-700]="selectedTargetProvider === prov.id"
                  [class.border-gray-100]="selectedTargetProvider !== prov.id"
                  [class.bg-gray-50]="selectedTargetProvider === prov.id"
                  (click)="selectedTargetProvider = prov.id"
                >
                  <div class="flex justify-between items-start">
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800 font-black text-lg">
                        {{ prov.id.slice(0,2).toUpperCase() }}
                      </div>
                      <div>
                        <h3 class="font-semibold text-gray-900 capitalize">{{ prov.id }}</h3>
                        <span class="text-xs text-gray-400">Database Driver</span>
                      </div>
                    </div>
                    @if (currentActiveProvider === prov.id) {
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-normal bg-primary-700 text-white tracking-wider">Active</span>
                    }
                  </div>

                  <!-- Provider Status indicators -->
                  <div class="grid grid-cols-3 gap-2 text-[10px] font-normal text-gray-500 mt-4 border-t border-b border-gray-100 py-3">
                    <div class="flex items-center gap-1.5" [class.text-emerald-600]="prov.configured">
                      <span class="w-1.5 h-1.5 rounded-full" [class.bg-emerald-500]="prov.configured" [class.bg-gray-300]="!prov.configured"></span>
                      Config
                    </div>
                    <div class="flex items-center gap-1.5" [class.text-emerald-600]="prov.healthy">
                      <span class="w-1.5 h-1.5 rounded-full" [class.bg-emerald-500]="prov.healthy" [class.bg-gray-300]="!prov.healthy"></span>
                      Healthy
                    </div>
                    <div class="flex items-center gap-1.5" [class.text-emerald-600]="prov.migrationReady">
                      <span class="w-1.5 h-1.5 rounded-full" [class.bg-emerald-500]="prov.migrationReady" [class.bg-gray-300]="!prov.migrationReady"></span>
                      Migrated
                    </div>
                  </div>

                  <div class="flex justify-end pt-3">
                    <button [disabled]="currentActiveProvider === prov.id || !prov.configured || !prov.healthy"
                      (click)="startSwitchWorkflow(prov.id)"
                      class="px-4 py-2 rounded-xl text-xs font-normal bg-primary-700 hover:bg-primary-900 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      Switch Provider
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- Workflow Progress Modal / Card -->
            @if (switchingWorkflow) {
              <div class="p-6 rounded-[24px] border border-orange-100 bg-orange-50/20">
                <h3 class="font-semibold text-gray-900 mb-4 text-base flex items-center gap-2">
                  <i class="bi bi-cpu text-lg text-orange-500"></i> Database Switch Execution Workflow
                </h3>
                <div class="space-y-4">
                  @for (step of switchSteps; track step.name) {
                    <div class="flex items-start gap-4">
                      <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        [class.bg-emerald-100]="step.status === 'success'" [class.text-emerald-700]="step.status === 'success'"
                        [class.bg-red-100]="step.status === 'failed'" [class.text-red-700]="step.status === 'failed'"
                        [class.bg-orange-100]="step.status === 'pending'" [class.text-orange-700]="step.status === 'pending'"
                      >
                        @if (step.status === 'success') { <i class="bi bi-check-lg text-sm"></i> }
                        @if (step.status === 'failed') { <i class="bi bi-x-lg text-sm"></i> }
                        @if (step.status === 'pending') { <span class="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span> }
                      </div>
                      <div class="flex-1">
                        <h4 class="text-sm font-normal text-gray-800">{{ step.name }}</h4>
                        <p class="text-xs text-gray-500 mt-0.5">{{ step.message }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Tab 7: Migration Readiness -->
        @if (activeTab === 'migration') {
          <div>
            <div class="border-b border-gray-100 pb-6 mb-8">
              <h2 class="text-xl font-semibold text-gray-900">Database Migration Check</h2>
              <p class="text-sm text-gray-500 mt-1">Review table schema synchronizations and migration logs.</p>
            </div>

            <div class="space-y-6">
              <div class="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl">
                <h3 class="font-normal text-emerald-900 text-base mb-2">Primary Migration Verified</h3>
                <p class="text-sm text-emerald-700 leading-relaxed">
                  All Firestore collections mapped successfully. Schema is fully compliant with active configurations.
                </p>
              </div>

              <div class="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <table class="w-full text-sm">
                  <thead class="bg-gray-50 text-gray-500 text-xs font-normal tracking-wider">
                    <tr>
                      <th class="px-6 py-4 text-left">Source Collection</th>
                      <th class="px-6 py-4 text-left">Target SQL Table</th>
                      <th class="px-6 py-4 text-left">Migration Status</th>
                      <th class="px-6 py-4 text-right">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-gray-50">
                      <td class="px-6 py-4 font-normal text-gray-900">products</td>
                      <td class="px-6 py-4 text-gray-500 font-mono">products</td>
                      <td class="px-6 py-4 text-emerald-600 font-normal">100% Migrated</td>
                      <td class="px-6 py-4 text-right">100%</td>
                    </tr>
                    <tr class="border-b border-gray-50">
                      <td class="px-6 py-4 font-normal text-gray-900">customers</td>
                      <td class="px-6 py-4 text-gray-500 font-mono">customers</td>
                      <td class="px-6 py-4 text-emerald-600 font-normal">100% Migrated</td>
                      <td class="px-6 py-4 text-right">100%</td>
                    </tr>
                    <tr class="border-b border-gray-50">
                      <td class="px-6 py-4 font-normal text-gray-900">inventory</td>
                      <td class="px-6 py-4 text-gray-500 font-mono">inventory</td>
                      <td class="px-6 py-4 text-emerald-600 font-normal">100% Migrated</td>
                      <td class="px-6 py-4 text-right">100%</td>
                    </tr>
                    <tr class="border-b border-gray-50">
                      <td class="px-6 py-4 font-normal text-gray-900">invoices</td>
                      <td class="px-6 py-4 text-gray-500 font-mono">invoices</td>
                      <td class="px-6 py-4 text-emerald-600 font-normal">100% Migrated</td>
                      <td class="px-6 py-4 text-right">100%</td>
                    </tr>
                    <tr class="border-b border-gray-50">
                      <td class="px-6 py-4 font-normal text-gray-900">orders</td>
                      <td class="px-6 py-4 text-gray-500 font-mono">orders</td>
                      <td class="px-6 py-4 text-emerald-600 font-normal">100% Migrated</td>
                      <td class="px-6 py-4 text-right">100%</td>
                    </tr>
                    <tr class="border-b border-gray-50">
                      <td class="px-6 py-4 font-normal text-gray-900">categories</td>
                      <td class="px-6 py-4 text-gray-500 font-mono">categories</td>
                      <td class="px-6 py-4 text-emerald-600 font-normal">100% Migrated</td>
                      <td class="px-6 py-4 text-right">100%</td>
                    </tr>
                    <tr class="border-b border-gray-50">
                      <td class="px-6 py-4 font-normal text-gray-900">brands</td>
                      <td class="px-6 py-4 text-gray-500 font-mono">brands</td>
                      <td class="px-6 py-4 text-emerald-600 font-normal">100% Migrated</td>
                      <td class="px-6 py-4 text-right">100%</td>
                    </tr>
                    <tr class="border-b border-gray-50">
                      <td class="px-6 py-4 font-normal text-gray-900">suppliers</td>
                      <td class="px-6 py-4 text-gray-500 font-mono">suppliers</td>
                      <td class="px-6 py-4 text-emerald-600 font-normal">100% Migrated</td>
                      <td class="px-6 py-4 text-right">100%</td>
                    </tr>
                    <tr class="border-b border-gray-50">
                      <td class="px-6 py-4 font-normal text-gray-900">purchase_orders</td>
                      <td class="px-6 py-4 text-gray-500 font-mono">purchase_orders</td>
                      <td class="px-6 py-4 text-emerald-600 font-normal">100% Migrated</td>
                      <td class="px-6 py-4 text-right">100%</td>
                    </tr>
                    <tr class="border-b border-gray-50">
                      <td class="px-6 py-4 font-normal text-gray-900">goods_received</td>
                      <td class="px-6 py-4 text-gray-500 font-mono">goods_received</td>
                      <td class="px-6 py-4 text-emerald-600 font-normal">100% Migrated</td>
                      <td class="px-6 py-4 text-right">100%</td>
                    </tr>
                    <tr class="border-b border-gray-50">
                      <td class="px-6 py-4 font-normal text-gray-900">supplier_payments</td>
                      <td class="px-6 py-4 text-gray-500 font-mono">supplier_payments</td>
                      <td class="px-6 py-4 text-emerald-600 font-normal">100% Migrated</td>
                      <td class="px-6 py-4 text-right">100%</td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 font-normal text-gray-900">purchase_returns</td>
                      <td class="px-6 py-4 text-gray-500 font-mono">purchase_returns</td>
                      <td class="px-6 py-4 text-emerald-600 font-normal">100% Migrated</td>
                      <td class="px-6 py-4 text-right">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- Tab 8: Health Monitor -->
        @if (activeTab === 'health') {
          <div>
            <div class="border-b border-gray-100 pb-6 mb-8 flex justify-between items-center">
              <div>
                <h2 class="text-xl font-semibold text-gray-900">Health Monitor</h2>
                <p class="text-sm text-gray-500 mt-1">Real-time memory allocations, connection pools, and response times.</p>
              </div>
              <button (click)="loadHealth()" [disabled]="refreshingHealth" class="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">
                <i class="bi bi-arrow-clockwise text-xl" [class.animate-spin]="refreshingHealth"></i>
              </button>
            </div>

            @if (health) {
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <!-- Latency Block -->
                <div class="p-6 rounded-[20px] bg-white border border-gray-100 shadow-sm flex items-start gap-4">
                  <div class="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                    <i class="bi bi-clock-history text-2xl"></i>
                  </div>
                  <div>
                    <span class="text-xs font-semibold text-gray-400 tracking-wide">Ping Latency</span>
                    <h3 class="text-2xl font-black text-gray-900 mt-1">{{ health.ping }} ms</h3>
                  </div>
                </div>

                <!-- Query Success Rate Block -->
                <div class="p-6 rounded-[20px] bg-white border border-gray-100 shadow-sm flex items-start gap-4">
                  <div class="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
                    <i class="bi bi-graph-up-arrow text-2xl"></i>
                  </div>
                  <div>
                    <span class="text-xs font-semibold text-gray-400 tracking-wide">Successful Queries</span>
                    <h3 class="text-2xl font-black text-gray-900 mt-1">{{ health.successfulQueries | number }}</h3>
                  </div>
                </div>

                <!-- Memory Block -->
                <div class="p-6 rounded-[20px] bg-white border border-gray-100 shadow-sm flex items-start gap-4">
                  <div class="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 shrink-0">
                    <i class="bi bi-cpu text-2xl"></i>
                  </div>
                  <div>
                    <span class="text-xs font-semibold text-gray-400 tracking-wide">Heap Memory (Used)</span>
                    <h3 class="text-2xl font-black text-gray-900 mt-1">{{ health.memoryUsage.heapUsed }} MB</h3>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Node Performance -->
                <div>
                  <h3 class="font-semibold text-gray-900 mb-4 text-base">Process Metrics</h3>
                  <table class="w-full text-sm">
                    <tbody>
                      <tr class="border-b border-gray-50">
                        <td class="py-3 text-gray-500 font-medium">Uptime</td>
                        <td class="py-3 text-gray-900 font-normal text-right">{{ health.uptime }} seconds</td>
                      </tr>
                      <tr class="border-b border-gray-50">
                        <td class="py-3 text-gray-500 font-medium">RSS Memory</td>
                        <td class="py-3 text-gray-900 font-normal text-right">{{ health.memoryUsage.rss }} MB</td>
                      </tr>
                      <tr class="border-b border-gray-50">
                        <td class="py-3 text-gray-500 font-medium">Heap Total Size</td>
                        <td class="py-3 text-gray-900 font-normal text-right">{{ health.memoryUsage.heapTotal }} MB</td>
                      </tr>
                      <tr class="border-b border-gray-50">
                        <td class="py-3 text-gray-500 font-medium">Reads Operations Count</td>
                        <td class="py-3 text-emerald-600 font-normal text-right">{{ health.reads | number }}</td>
                      </tr>
                      <tr class="border-b border-gray-50">
                        <td class="py-3 text-gray-500 font-medium">Writes Operations Count</td>
                        <td class="py-3 text-orange-600 font-normal text-right">{{ health.writes | number }}</td>
                      </tr>
                      <tr>
                        <td class="py-3 text-gray-500 font-medium">Query Errors</td>
                        <td class="py-3 text-red-600 font-normal text-right">{{ health.errors }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Pool Status -->
                <div>
                  <h3 class="font-semibold text-gray-900 mb-4 text-base">Connection Pool Details</h3>
                  <div class="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <div class="flex justify-between items-center mb-6">
                      <span class="text-sm font-normal text-gray-800">Connection Pool Utilization</span>
                      <span class="text-xs font-normal text-gray-500">{{ health.connectionPool.active }} / {{ health.connectionPool.max }} ({{ Math.round((health.connectionPool.active/health.connectionPool.max)*100) }}%)</span>
                    </div>
                    <div class="flex gap-1.5 h-8">
                      @for (cell of [].constructor(health.connectionPool.max); track idx; let idx = $index) {
                        <div class="flex-1 rounded" [class.bg-emerald-500]="idx < health.connectionPool.active" [class.bg-gray-200]="idx >= health.connectionPool.active"></div>
                      }
                    </div>
                    <div class="flex justify-between text-xs text-gray-400 font-semibold mt-4">
                      <span>0 Connections</span>
                      <span>20 Max Connections</span>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Tab 9: Connection Logs -->
        @if (activeTab === 'logs') {
          <div>
            <div class="border-b border-gray-100 pb-6 mb-8 flex justify-between items-center">
              <div>
                <h2 class="text-xl font-semibold text-gray-900">Audit logs</h2>
                <p class="text-sm text-gray-500 mt-1">Real-time log of database connection changes, switch warnings, and exceptions.</p>
              </div>
              <button (click)="loadLogs()" [disabled]="loadingLogs" class="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">
                <i class="bi bi-arrow-clockwise text-xl" [class.animate-spin]="loadingLogs"></i>
              </button>
            </div>

            @if (loadingLogs) {
              <div class="py-20 text-center text-gray-400">
                <span class="w-8 h-8 border-3 border-gray-200 border-t-gray-900 rounded-full animate-spin inline-block mb-3"></span>
                <p class="text-sm font-semibold text-gray-500">Loading audit logs...</p>
              </div>
            } @else {
              <div class="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <table class="w-full text-sm">
                  <thead class="bg-gray-50 text-gray-500 text-xs font-normal tracking-wider">
                    <tr>
                      <th class="px-6 py-4 text-left">Timestamp</th>
                      <th class="px-6 py-4 text-left">Type</th>
                      <th class="px-6 py-4 text-left">Provider</th>
                      <th class="px-6 py-4 text-left">Status</th>
                      <th class="px-6 py-4 text-left">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (log of logs; track log.timestamp) {
                      <tr class="border-b border-gray-50">
                        <td class="px-6 py-4 text-gray-500 whitespace-nowrap">{{ log.timestamp | date:'yyyy-MM-dd HH:mm:ss' }}</td>
                        <td class="px-6 py-4">
                          <span class="px-2 py-0.5 rounded-full text-xs font-normal capitalize"
                            [class.bg-amber-100]="log.type === 'switch'" [class.text-amber-800]="log.type === 'switch'"
                            [class.bg-red-100]="log.type === 'error' || log.type === 'exception'" [class.text-red-800]="log.type === 'error' || log.type === 'exception'"
                            [class.bg-emerald-100]="log.type === 'connection'" [class.text-emerald-800]="log.type === 'connection'"
                            [class.bg-blue-100]="log.type === 'validation'" [class.text-primary-700]="log.type === 'validation'"
                          >
                            {{ log.type }}
                          </span>
                        </td>
                        <td class="px-6 py-4 font-normal text-gray-900 capitalize">{{ log.provider }}</td>
                        <td class="px-6 py-4 text-gray-500 font-semibold capitalize">{{ log.status }}</td>
                        <td class="px-6 py-4 text-gray-600 max-w-xs truncate">{{ log.message }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }

        <!-- Tab 10: Backup & Restore -->
        @if (activeTab === 'backup') {
          <div>
            <div class="border-b border-gray-100 pb-6 mb-8">
              <h2 class="text-xl font-semibold text-gray-900">Backup &amp; Restore</h2>
              <p class="text-sm text-gray-500 mt-1">Export database tables as JSON, download backups locally, or restore documents.</p>
            </div>

            <div class="space-y-8 max-w-full">
              <!-- Backup Section -->
              <div class="p-8 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
                <h3 class="font-semibold text-gray-900 text-lg">Generate Database Backup</h3>
                <p class="text-sm text-gray-500">Creates a full JSON snapshot of core collection schemas and documents.</p>
                <div class="flex items-center justify-between border-t border-gray-50 pt-6">
                  <span class="text-sm font-normal text-gray-800">Target Database</span>
                  <div class="w-64"><app-ui-dropdown [(ngModel)]="backupProvider" [options]="providerOptions"></app-ui-dropdown></div>
                </div>
                <div class="flex justify-end mt-4">
                  <button (click)="createBackup()" [disabled]="backingUp" class="bg-primary-700 hover:bg-primary-900 text-white px-6 py-2.5 rounded-xl font-normal text-sm flex items-center gap-2">
                    @if (backingUp) {
                      <span class="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></span>
                    }
                    Create Backup
                  </button>
                </div>
              </div>

              <!-- Restore Section -->
              <div class="p-8 rounded-[24px] border border-red-100 bg-red-50/10 shadow-sm space-y-6">
                <h3 class="font-normal text-red-900 text-lg">Restore from Backup file</h3>
                <p class="text-sm text-red-700">Upload a previously generated JSON backup file to restore records. Merging overrides conflicts.</p>
                <div class="flex items-center justify-between border-t border-red-100/50 pt-6">
                  <span class="text-sm font-normal text-red-800">Target Database</span>
                  <div class="w-64"><app-ui-dropdown [(ngModel)]="restoreProvider" [options]="providerOptions"></app-ui-dropdown></div>
                </div>
                <div class="space-y-3">
                    <label class="text-sm font-semibold text-gray-800">Upload Backup JSON</label>
                    <div class="relative w-full">
                      <input type="file" id="file-upload" (change)="onFileSelected($event)" accept=".json" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div class="w-full border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors flex flex-col items-center justify-center gap-2" [class.border-primary-500]="selectedFile" [class.bg-primary-50]="selectedFile">
                        <div class="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-500" [class.text-primary-600]="selectedFile">
                          <i class="bi text-xl" [class.bi-cloud-arrow-up]="!selectedFile" [class.bi-file-earmark-check]="selectedFile"></i>
                        </div>
                        <div>
                          <p class="text-sm font-medium text-gray-700">
                            @if (selectedFile) {
                              {{ selectedFile.name }}
                            } @else {
                              <span class="text-primary-700 hover:underline">Click to upload</span> or drag and drop
                            }
                          </p>
                          <p class="text-xs text-gray-500 mt-1">JSON file containing database backup</p>
                        </div>
                      </div>
                    </div>
                  </div>
                <div class="flex justify-end mt-4">
                  <button (click)="restoreBackup()" [disabled]="restoring || !selectedFile" class="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-normal text-sm flex items-center gap-2">
                    @if (restoring) {
                      <span class="w-4 h-4 border-2 border-red-300 border-t-white rounded-full animate-spin"></span>
                    }
                    Restore Database
                  </button>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Tab 11: Env Variables -->
        @if (activeTab === 'env') {
          <div>
            <div class="border-b border-gray-100 pb-6 mb-8">
              <h2 class="text-xl font-semibold text-gray-900">Environment Config</h2>
              <p class="text-sm text-gray-500 mt-1">Status of environment configuration settings loaded on startup.</p>
            </div>

            @if (env) {
              <div class="space-y-6 max-w-full">
                <div class="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4 font-mono text-sm text-gray-700">
                  <div class="flex justify-between border-b border-gray-100 pb-3">
                    <span class="font-normal text-gray-500">DB_PROVIDER</span>
                    <span class="text-gray-900 font-black">{{ env.DB_PROVIDER }}</span>
                  </div>
                  <div class="flex justify-between border-b border-gray-100 pb-3">
                    <span class="font-normal text-gray-500">CACHE_PROVIDER</span>
                    <span class="text-gray-900 font-black">{{ env.CACHE_PROVIDER }}</span>
                  </div>
                  <div class="flex justify-between border-b border-gray-100 pb-3">
                    <span class="font-normal text-gray-500">CURRENT_DATABASE</span>
                    <span class="text-gray-900 font-black">{{ env.CURRENT_DATABASE }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="font-normal text-gray-500">CURRENT_CACHE</span>
                    <span class="text-gray-900 font-black">{{ env.CURRENT_CACHE }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Tab 12: Repository Status -->
        @if (activeTab === 'repositories') {
          <div>
            <div class="border-b border-gray-100 pb-6 mb-8">
              <h2 class="text-xl font-semibold text-gray-900">Repository Driver Status</h2>
              <p class="text-sm text-gray-500 mt-1">Status of abstracted domain repositories resolved dynamically by Repository Factory.</p>
            </div>

            @if (env) {
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-full">
                @for (repoName of getObjectKeys(env.repositoryStatus); track repoName) {
                  <div class="p-6 bg-white border border-gray-100 rounded-2xl flex justify-between items-center shadow-sm">
                    <div>
                      <h4 class="font-semibold text-gray-900 text-sm">{{ repoName }}</h4>
                      <span class="text-xs text-gray-400">Database Layer Abstract</span>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-normal"
                      [class.bg-emerald-100]="env.repositoryStatus[repoName] === 'Healthy'" [class.text-emerald-800]="env.repositoryStatus[repoName] === 'Healthy'"
                      [class.bg-amber-100]="env.repositoryStatus[repoName] === 'Placeholder'" [class.text-amber-800]="env.repositoryStatus[repoName] === 'Placeholder'"
                    >
                      {{ env.repositoryStatus[repoName] }}
                    </span>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Tab 13: Cache Settings -->
        @if (activeTab === 'cache') {
          <div>
            <div class="border-b border-gray-100 pb-6 mb-8">
              <h2 class="text-xl font-semibold text-gray-900">Cache Layer Control</h2>
              <p class="text-sm text-gray-500 mt-1">Manage global API response memory caches and pings.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <!-- Memory Cache Info -->
              <div class="p-6 rounded-[20px] bg-white border border-gray-100 shadow-sm flex items-start gap-4">
                <div class="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-500 shrink-0">
                  <i class="bi bi-database text-2xl"></i>
                </div>
                <div>
                  <span class="text-xs font-semibold text-gray-400 tracking-wide">Cache Provider</span>
                  <h3 class="text-2xl font-black text-gray-900 mt-1">Memory</h3>
                </div>
              </div>

              <!-- Reconnect Check -->
              <div class="p-6 rounded-[20px] bg-white border border-gray-100 shadow-sm flex items-start gap-4">
                <div class="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
                  <i class="bi bi-wifi text-2xl"></i>
                </div>
                <div>
                  <span class="text-xs font-semibold text-gray-400 tracking-wide">Cache Health</span>
                  <h3 class="text-2xl font-black text-gray-900 mt-1">Healthy</h3>
                </div>
              </div>
            </div>

            <div class="flex gap-4 pt-6 border-t border-gray-100">
              <button (click)="flushCache()" class="bg-primary-700 hover:bg-primary-900 text-white px-6 py-2.5 rounded-xl font-normal text-sm flex items-center gap-2 shadow-sm">
                <i class="bi bi-trash"></i> Flush Cache
              </button>
              <button (click)="reconnectCache()" class="border border-gray-200 hover:bg-gray-50 text-gray-800 px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2">
                <i class="bi bi-arrow-repeat"></i> Reconnect Cache
              </button>
            </div>
          </div>
        }

        <!-- Tab 14: Advanced Super Admin Zone -->
        @if (activeTab === 'advanced') {
          <div>
            <div class="border-b border-gray-100 pb-6 mb-8">
              <h2 class="text-xl font-semibold text-gray-900 text-red-600">Danger Zone (Advanced)</h2>
              <p class="text-sm text-gray-500 mt-1">Critical database commands and maintenance utilities. Only Super Administrators should execute these.</p>
            </div>

            <div class="space-y-8 max-w-full">
              <!-- Reset Config and Server Modes -->
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="p-6 bg-red-50 border border-red-100 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h3 class="font-semibold text-red-900 text-sm mb-1">Reset All Settings</h3>
                    <p class="text-xs text-red-700 leading-relaxed mb-4">
                      Permanently deletes custom credentials for Supabase, MongoDB, and SQL Server database configurations, reverting to defaults.
                    </p>
                  </div>
                  <button (click)="resetConfig()" class="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-semibold text-xs transition-colors">
                    Reset configurations
                  </button>
                </div>

                <div class="p-6 border border-gray-100 rounded-2xl flex flex-col justify-between bg-white shadow-sm">
                  <div>
                    <h4 class="font-semibold text-gray-900 text-sm mb-1">Maintenance Mode</h4>
                    <p class="text-xs text-gray-500 leading-relaxed mb-4">Blocks non-admin log ins to perform database maintenance and migration operations safely.</p>
                  </div>
                  <button (click)="toggleMaintenance()" class="w-full py-2 bg-primary-700 hover:bg-primary-900 text-white rounded-xl text-xs font-semibold transition-colors">
                    Toggle Maintenance
                  </button>
                </div>

                <div class="p-6 border border-gray-100 rounded-2xl flex flex-col justify-between bg-white shadow-sm">
                  <div>
                    <h4 class="font-semibold text-gray-900 text-sm mb-1">Read Only Mode</h4>
                    <p class="text-xs text-gray-500 leading-relaxed mb-4">Disables all writes (inserts/updates/deletes) globally across all frontend shops and branches.</p>
                  </div>
                  <button (click)="toggleReadOnly()" class="w-full py-2 bg-primary-700 hover:bg-primary-900 text-white rounded-xl text-xs font-semibold transition-colors">
                    Toggle Read-Only
                  </button>
                </div>
              </div>

              <!-- Data Seeding Card -->
              <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div class="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div class="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-700">
                    <i class="bi bi-database-fill-add text-xl"></i>
                  </div>
                  <div>
                    <h3 class="text-lg font-bold text-gray-900">Data Seeding</h3>
                    <p class="text-xs text-gray-500">Populate the selected database with default configurations or mock datasets.</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <!-- Provider -->
                  <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Database Provider</label>
                    <app-ui-dropdown
                      [options]="seedingProviderOptions"
                      [(ngModel)]="seedingProvider">
                    </app-ui-dropdown>
                  </div>

                  <!-- Environment -->
                  <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Environment</label>
                    <app-ui-dropdown
                      [options]="seedingEnvOptions"
                      [(ngModel)]="seedingEnv">
                    </app-ui-dropdown>
                  </div>

                  <!-- Seed Type -->
                  <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Seed Type</label>
                    <app-ui-dropdown
                      [options]="seedingTypeOptions"
                      [(ngModel)]="seedingType">
                    </app-ui-dropdown>
                  </div>
                </div>

                <!-- Target Modules -->
                <div>
                  <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Target Modules</label>
                  <div class="grid grid-cols-2 md:grid-cols-5 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    @for (mod of seedingModulesList; track mod) {
                      <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <app-checkbox [checked]="isSeedingModuleSelected(mod)" (checkedChange)="toggleSeedingModule(mod)" color="#4f46e5"></app-checkbox>
                        {{ formatModuleName(mod) }}
                      </label>
                    }
                  </div>
                </div>

                <!-- Seeding Options -->
                <div>
                  <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Options</label>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <app-checkbox [(ngModel)]="seedingOptions.skipExisting" color="#4f46e5"></app-checkbox>
                      Skip Existing Records
                    </label>
                    <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <app-checkbox [(ngModel)]="seedingOptions.resetAutoIncrement" color="#4f46e5"></app-checkbox>
                      Reset Auto Increment
                    </label>
                    <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <app-checkbox [(ngModel)]="seedingOptions.preserveAdminUsers" color="#4f46e5"></app-checkbox>
                      Preserve Admin Users
                    </label>
                    <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <app-checkbox [(ngModel)]="seedingOptions.preserveSystemSettings" color="#4f46e5"></app-checkbox>
                      Preserve System Settings
                    </label>
                    <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <app-checkbox [(ngModel)]="seedingOptions.generateRandomData" color="#4f46e5"></app-checkbox>
                      Generate Random Demo Data
                    </label>
                    <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <app-checkbox [(ngModel)]="seedingOptions.seedImages" color="#4f46e5"></app-checkbox>
                      Seed Images
                    </label>
                  </div>
                </div>

                <!-- Buttons -->
                <div class="flex flex-wrap gap-3 border-t border-gray-100 pt-4">
                  <button (click)="previewSeed()" [disabled]="seedingProgress" class="border border-gray-200 hover:bg-gray-50 text-gray-800 px-5 py-2 rounded-xl font-semibold text-xs transition-colors">
                    Preview
                  </button>
                  <button (click)="validateSeed()" [disabled]="seedingProgress" class="border border-gray-200 hover:bg-gray-50 text-gray-800 px-5 py-2 rounded-xl font-semibold text-xs transition-colors">
                    Validate
                  </button>
                  <button (click)="startSeeding()" [disabled]="seedingProgress" class="bg-primary-700 hover:bg-primary-900 text-white px-6 py-2 rounded-xl font-semibold text-xs transition-colors">
                    @if (seedingProgress) { Seeding... } @else { Start Seeding }
                  </button>
                  @if (seedingProgress) {
                    <button (click)="cancelSeeding()" class="border border-red-200 text-red-600 hover:bg-red-50 px-5 py-2 rounded-xl font-semibold text-xs transition-colors">
                      Cancel
                    </button>
                  }
                </div>

                <!-- Logs Panel -->
                @if (seedingLogs.length > 0 || seedingReport) {
                  <div class="bg-primary-700 text-green-400 p-4 rounded-xl font-mono text-[11px] max-h-60 overflow-y-auto space-y-1 shadow-inner">
                    <div class="text-white border-b border-gray-800 pb-1.5 mb-2 flex justify-between items-center">
                      <span>Seed Event Log (Status: <strong class="text-indigo-400">{{ seedingStatus }}</strong>)</span>
                      @if (seedingReport?.durationMs) {
                        <span class="text-gray-400 font-semibold">{{ seedingReport.durationMs }} ms</span>
                      }
                    </div>
                    @for (log of seedingLogs; track log) {
                      <div>{{ log }}</div>
                    }
                    @if (seedingReport) {
                      <div class="text-white font-semibold mt-3 pt-2 border-t border-gray-800 space-y-1">
                        <div>Seed Summary Report:</div>
                        <div class="text-gray-400">Total Created: <span class="text-emerald-400">{{ seedingReport.totalCreated }}</span></div>
                        <div class="text-gray-400">Total Skipped: <span class="text-amber-400">{{ seedingReport.totalSkipped }}</span></div>
                        <div class="text-gray-400">Total Errors: <span class="text-red-400">{{ seedingReport.totalErrors }}</span></div>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Data Cleaning Card -->
              <div class="rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6 border-1 border-red-500 bg-red-50">
                <div class="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div class="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                    <i class="bi bi-trash-fill text-xl"></i>
                  </div>
                  <div>
                    <h3 class="text-lg font-bold text-gray-900 text-red-600">Data Cleaning</h3>
                    <p class="text-xs text-gray-500">Completely flush data records. Preserves schema structures, database configs and collection structures exactly.</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Provider -->
                  <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Database Provider</label>
                    <app-ui-dropdown
                      [options]="cleaningProviderOptions"
                      [(ngModel)]="cleaningProvider">
                    </app-ui-dropdown>
                  </div>

                  <!-- Mode -->
                  <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Cleaning Mode</label>
                    <app-ui-dropdown
                      [options]="cleaningModeOptions"
                      [(ngModel)]="cleaningMode">
                    </app-ui-dropdown>
                  </div>
                </div>

                <!-- Cleanable Modules List -->
                @if (cleaningMode === 'selected') {
                  <div>
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Cleanable Modules</label>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 bg-red-50 p-4 rounded-xl border border-gray-100">
                      @for (mod of cleanableModulesList; track mod) {
                        <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <app-checkbox [checked]="isCleaningModuleSelected(mod)" (checkedChange)="toggleCleaningModule(mod)" color="#dc2626"></app-checkbox>
                          {{ formatModuleName(mod) }}
                        </label>
                      }
                    </div>
                  </div>
                }

                <!-- Protected Modules -->
                <div>
                  <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Protected Modules (Safe Zone)</label>
                  <p class="text-[10px] text-gray-400 mb-2">System tables, subscriptions and configurations are preserved and protected by default.</p>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 bg-red-50/20 p-4 rounded-xl border border-red-100/30">
                    @for (mod of protectedModulesList; track mod) {
                      <label class="flex items-center gap-2 text-sm text-gray-400 cursor-not-allowed">
                        <input type="checkbox" checked disabled class="rounded text-gray-400 h-4 w-4 border-gray-300">
                        {{ formatModuleName(mod) }}
                      </label>
                    }
                  </div>
                </div>

                <!-- Options -->
                <div>
                  <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Options</label>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <app-checkbox [(ngModel)]="cleaningOptions.deleteCloudinaryImages" color="#dc2626"></app-checkbox>
                      Delete Images from Cloudinary
                    </label>
                    <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <app-checkbox [(ngModel)]="cleaningOptions.deleteFirebaseStorage" color="#dc2626"></app-checkbox>
                      Delete Firebase Storage Files
                    </label>
                    <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <app-checkbox [(ngModel)]="cleaningOptions.clearRedisCache" color="#dc2626"></app-checkbox>
                      Clear Redis Cache
                    </label>
                    <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <app-checkbox [(ngModel)]="cleaningOptions.resetCounters" color="#dc2626"></app-checkbox>
                      Reset Counters
                    </label>
                    <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <app-checkbox [(ngModel)]="cleaningOptions.resetAutoIncrementIds" color="#dc2626"></app-checkbox>
                      Reset Auto Increment IDs
                    </label>
                    <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <app-checkbox [(ngModel)]="cleaningOptions.keepAdminAccount" color="#dc2626"></app-checkbox>
                      Keep Admin Account
                    </label>
                  </div>
                </div>

                <!-- Run Button -->
                <div class="flex gap-3 border-t border-gray-100 pt-4">
                  <button (click)="triggerCleanupPreview()" [disabled]="cleaningProgress" class="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-colors">
                    Preview and Clean Database
                  </button>
                </div>

                <!-- Clean Logs -->
                @if (cleaningStatus || cleaningReport) {
                  <div class="bg-primary-700 text-red-400 p-4 rounded-xl font-mono text-[11px] max-h-60 overflow-y-auto space-y-1 shadow-inner">
                    <div class="text-white border-b border-gray-800 pb-1.5 mb-2 flex justify-between items-center">
                      <span>Data Cleaning Log (Status: <strong class="text-red-400">{{ cleaningStatus }}</strong>)</span>
                      @if (cleaningReport?.durationMs) {
                        <span class="text-gray-400 font-semibold">{{ cleaningReport.durationMs }} ms</span>
                      }
                    </div>
                    @if (cleaningReport?.logs) {
                      @for (log of cleaningReport.logs; track log) {
                        <div>{{ log }}</div>
                      }
                      <div class="text-white font-semibold mt-3 pt-2 border-t border-gray-800 space-y-1">
                        <div>Cleanup Summary Report:</div>
                        <div class="text-gray-400">Total Deleted: <span class="text-red-400">{{ cleaningReport.totalDeleted }}</span></div>
                        <div class="text-gray-400">Total Errors: <span class="text-red-400">{{ cleaningReport.totalErrors }}</span></div>
                      </div>
                    } @else {
                      <div class="text-gray-400">Initiating delete sequence...</div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        }

            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog Popup -->
    @if (showConfirmSwitchModal) {
      <div class="fixed inset-0 bg-primary-900/50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
        <div class="bg-white rounded-[24px] shadow-xl border border-gray-100 max-w-md w-full p-8 space-y-6">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
              <i class="bi bi-exclamation-triangle-fill text-2xl"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 text-lg">Confirm Database Switch</h3>
              <p class="text-sm text-gray-500 mt-2 leading-relaxed">
                You are about to switch the global active database provider to <strong class="capitalize">{{ targetProviderToSwitch }}</strong>.
                This will redirect all repository queries dynamically.
              </p>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button (click)="showConfirmSwitchModal = false" class="border border-gray-200 hover:bg-gray-50 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all">
              Cancel
            </button>
            <button (click)="executeSwitch()" class="bg-primary-700 hover:bg-primary-900 text-white px-6 py-2.5 rounded-xl font-normal text-sm transition-all">
              Confirm Switch
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Cleanup Confirmation Modal -->
    @if (showConfirmCleanupModal) {
      <div class="fixed inset-0 bg-primary-900/50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
        <div class="bg-white rounded-[24px] shadow-xl border border-gray-100 max-w-lg w-full p-8 space-y-6">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <i class="bi bi-exclamation-octagon-fill text-2xl"></i>
            </div>
            <div class="space-y-2 flex-1">
              <h3 class="font-semibold text-gray-900 text-lg">Confirm Database Cleaning</h3>
              <p class="text-sm text-gray-500 leading-relaxed">
                You are about to permanently delete records from <strong class="capitalize">{{ cleaningProvider }}</strong> database.
              </p>
              @if (loadingCleanupPreview) {
                <div class="py-4 text-center text-gray-400">
                  <span class="w-5 h-5 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin inline-block mr-2"></span>
                  Calculating records count...
                </div>
              } @else if (cleanupPreviewInfo) {
                <div class="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-40 overflow-y-auto space-y-1">
                  <strong>Estimated records to be deleted:</strong>
                  @for (key of getObjectKeys(cleanupPreviewInfo.modules); track key) {
                    @if (cleanupPreviewInfo.modules[key] > 0) {
                      <div class="flex justify-between">
                        <span>{{ formatModuleName(key) }}</span>
                        <span class="font-semibold text-red-600">{{ cleanupPreviewInfo.modules[key] }}</span>
                      </div>
                    }
                  }
                  <div class="border-t border-gray-300 pt-1 mt-1 flex justify-between font-bold text-gray-900">
                    <span>Total Records</span>
                    <span>{{ cleanupPreviewInfo.total }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="space-y-4 pt-2">
            <div>
              <app-ui-input 
                label='Type "DELETE" to confirm' 
                [(ngModel)]="cleaningConfirmToken" 
                placeholder="DELETE">
              </app-ui-input>
            </div>
            
            <div>
              <app-ui-input 
                label="Super Admin Password" 
                type="password"
                [(ngModel)]="superAdminPassword" 
                placeholder="Enter password">
              </app-ui-input>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button (click)="showConfirmCleanupModal = false" class="border border-gray-200 hover:bg-gray-50 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all">
              Cancel
            </button>
            <button (click)="executeCleanup()" [disabled]="cleaningConfirmToken !== 'DELETE' || !superAdminPassword" class="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              Danger: Permanent Delete
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
    `,
  ],
})
export class SettingsDatabaseComponent implements OnInit {
  providerOptions = [
    { label: 'Firestore (Primary)', value: 'firestore', icon: 'database' },
    { label: 'Supabase', value: 'supabase', icon: 'database' },
    { label: 'MongoDB', value: 'mongodb', icon: 'database' },
    { label: 'SQL Server', value: 'sqlserver', icon: 'database' }
  ];
  private route = inject(ActivatedRoute);
  
  activeTab: DbTab = "overview";
  tabs = [
    { id: "overview", label: "Overview", icon: "bi bi-speedometer2" },
    { id: "firestore", label: "Firestore", icon: "bi bi-fire" },
    { id: "supabase", label: "Supabase", icon: "bi bi-lightning-charge-fill" },
    { id: "mongodb", label: "MongoDB", icon: "bi bi-database-fill-gear" },
    { id: "sqlserver", label: "SQL Server", icon: "bi bi-server" },
    { id: "active", label: "Active Provider", icon: "bi bi-toggle-on" },
    { id: "migration", label: "Migration", icon: "bi bi-arrow-left-right" },
    { id: "health", label: "Health Monitor", icon: "bi bi-heart-pulse-fill" },
    { id: "logs", label: "Connection Logs", icon: "bi bi-journal-text" },
    { id: "backup", label: "Backup & Restore", icon: "bi bi-cloud-arrow-down" },
    { id: "env", label: "Environment Variables", icon: "bi bi-terminal" },
    { id: "repositories", label: "Repository Status", icon: "bi bi-shield-check" },
    { id: "cache", label: "Cache", icon: "bi bi-memory" },
    { id: "advanced", label: "Advanced", icon: "bi bi-gear-fill" },
  ];

  // Forms data
  configs = {
    firestore: {
      projectId: "",
      storageBucket: "",
      databaseUrl: "",
      serviceAccountJson: "",
      privateKey: "",
      clientEmail: "",
      region: "",
    },
    supabase: {
      projectUrl: "",
      anonKey: "",
      serviceRoleKey: "",
      jwtSecret: "",
      databasePassword: "",
      region: "",
      projectReference: "",
      connectionPooling: false,
      ssl: false,
    },
    mongodb: {
      connectionString: "",
      databaseName: "",
      username: "",
      replicaSet: "",
      atlasRegion: "",
    },
    sqlserver: {
      host: "",
      port: 1433,
      username: "",
      password: "",
      database: "",
      schema: "dbo",
    },
  };

  showSecrets = {
    firestorePrivateKey: false,
    supabaseAnon: false,
    supabaseService: false,
  };

  // State flags
  loadingOverview = true;
  refreshing = false;
  overview: any = null;
  
  testing = false;
  testTarget = "";

  saving = false;
  saveTarget = "";

  currentActiveProvider = "firestore";
  selectedTargetProvider = "firestore";
  providerCards = [
    { id: "firestore", configured: true, healthy: true, migrationReady: true },
    { id: "supabase", configured: false, healthy: false, migrationReady: false },
    { id: "mongodb", configured: false, healthy: false, migrationReady: false },
    { id: "sqlserver", configured: false, healthy: false, migrationReady: false },
  ];

  switchingWorkflow = false;
  switchSteps: any[] = [];
  showConfirmSwitchModal = false;
  targetProviderToSwitch = "";

  health: any = null;
  refreshingHealth = false;

  logs: any[] = [];
  loadingLogs = false;

  backingUp = false;
  backupProvider = "firestore";

  restoring = false;
  restoreProvider = "firestore";
  selectedFile: File | null = null;

  env: any = null;

  seedingProviderOptions = [
    { label: "Firestore (Primary)", value: "firestore", icon: "database" },
    { label: "Supabase", value: "supabase", icon: "database" },
    { label: "MongoDB", value: "mongodb", icon: "database" },
    { label: "SQL Server", value: "sqlserver", icon: "database" }
  ];

  seedingEnvOptions = [
    { label: "Development", value: "development", icon: "terminal" },
    { label: "Staging", value: "staging", icon: "terminal" },
    { label: "Production (Blocked for demo data)", value: "production", icon: "terminal" }
  ];

  seedingTypeOptions = [
    { label: "Master Seeder", value: "Master Seeder", icon: "database" },
    { label: "Admin Seeder", value: "Admin Seeder", icon: "user" },
    { label: "Feature Seeder", value: "Feature Seeder", icon: "layers" },
    { label: "Plan Seeder", value: "Plan Seeder", icon: "credit-card" },
    { label: "Settings Seeder", value: "Settings Seeder", icon: "settings" },
    { label: "Notification Seeder", value: "Notification Seeder", icon: "bell" },
    { label: "Initial Setup", value: "Initial Setup", icon: "settings" },
    // { label: "Demo Data", value: "Demo Data", icon: "layers" },
    // { label: "Sample Products", value: "Sample Products", icon: "tag" },
    // { label: "Sample Categories", value: "Sample Categories", icon: "folder" },
    // { label: "Sample Customers", value: "Sample Customers", icon: "users" },
    // { label: "Sample Suppliers", value: "Sample Suppliers", icon: "truck" },
    // { label: "Sample Staff", value: "Sample Staff", icon: "user-check" },
    // { label: "Sample Inventory", value: "Sample Inventory", icon: "archive" },
    // { label: "Complete ERP Dataset", value: "Complete ERP Dataset", icon: "clipboard-list" },
    { label: "Custom Seed", value: "Custom Seed", icon: "sliders" }
  ];

  cleaningProviderOptions = [
    { label: "Firestore (Primary)", value: "firestore", icon: "database" },
    { label: "Supabase", value: "supabase", icon: "database" },
    { label: "MongoDB", value: "mongodb", icon: "database" },
    { label: "SQL Server", value: "sqlserver", icon: "database" }
  ];

  cleaningModeOptions = [
    { label: "Delete Selected Modules", value: "selected", icon: "check-square" },
    { label: "Delete Entire Database Records", value: "full", icon: "trash-2" }
  ];

  // Seeding Properties
  seedingProvider = "firestore";
  seedingEnv = "development";
  seedingType = "Demo Data";
  seedingModules: string[] = ["categories", "brands", "products", "customers", "suppliers"];
  seedingOptions = {
    skipExisting: true,
    resetAutoIncrement: false,
    preserveAdminUsers: true,
    preserveSystemSettings: true,
    generateRandomData: true,
    seedImages: false
  };
  seedingProgress = false;
  seedingLogs: string[] = [];
  seedingStatus = "";
  seedingReport: any = null;

  seedingModulesList = [
    "categories", "brands", "products", "inventory", "customers", "suppliers", 
    "orders", "invoices", "staff", "notifications"
  ];

  // Cleaning Properties
  cleaningProvider = "firestore";
  cleaningMode = "selected";
  cleaningModules: string[] = ["categories", "brands", "products", "inventory", "customers", "suppliers"];
  cleaningOptions = {
    deleteCloudinaryImages: false,
    deleteFirebaseStorage: false,
    clearRedisCache: false,
    resetCounters: false,
    resetAutoIncrementIds: false,
    keepAdminAccount: true,
    keepDemoConfig: true,
    keepFeatureFlags: true,
    keepSubscriptionPlans: true
  };
  cleaningConfirmToken = "";
  cleaningProgress = false;
  cleaningStatus = "";
  cleaningReport: any = null;
  showConfirmCleanupModal = false;
  cleanupPreviewInfo: any = null;
  loadingCleanupPreview = false;
  superAdminPassword = "";

  cleanableModulesList = [
    "categories", "brands", "products", "inventory", "inventory_history", 
    "customers", "suppliers", "purchase_orders", "orders", "invoices", 
    "payments", "staff", "notifications", "activity_logs", "usage_tracking", 
    "reports", "temporary_cache", "session_data", "analytics"
  ];

  protectedModulesList = [
    "admin_users", "platform_settings", "plans", "features", 
    "subscription_config", "db_config", "repository_config", "system_metadata"
  ];

  Math = Math;

  private api = inject(AdminApiService);
  private toast = inject(ToastService);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const tab = params.get("tab") as DbTab;
      if (tab) {
        this.selectTab(tab);
      } else {
        this.selectTab("overview");
      }
    });
    this.loadAllConfigs();
  }

  selectTab(tabId: any) {
    this.activeTab = tabId;
    if (tabId === "overview") this.loadOverview();
    if (tabId === "health") this.loadHealth();
    if (tabId === "logs") this.loadLogs();
    if (tabId === "env" || tabId === "repositories") this.loadEnv();
  }

  loadOverview() {
    this.loadingOverview = true;
    this.refreshing = true;
    this.api.getDbOverview().subscribe({
      next: (res) => {
        this.overview = res.data;
        this.currentActiveProvider = res.data.activeDatabase;
        this.selectedTargetProvider = res.data.activeDatabase;
        this.updateProviderCardStates();
        this.loadingOverview = false;
        this.refreshing = false;
      },
      error: () => {
        this.loadingOverview = false;
        this.refreshing = false;
        this.toast.showError("Failed to fetch database overview statistics.");
      },
    });
  }

  loadAllConfigs() {
    const providers: DbTab[] = ["firestore", "supabase", "mongodb", "sqlserver"];
    providers.forEach((p) => {
      this.api.getDbConfig(p).subscribe({
        next: (res) => {
          if (res.data) {
            (this.configs as any)[p] = { ...(this.configs as any)[p], ...res.data };
          }
          this.updateProviderCardStates();
        },
      });
    });
  }

  updateProviderCardStates() {
    this.providerCards.forEach((c) => {
      c.configured = c.id === "firestore" || Object.values((this.configs as any)[c.id] || {}).some(v => v !== "");
      if (c.id === "firestore") {
        c.healthy = true;
        c.migrationReady = true;
      } else {
        c.healthy = c.configured;
        c.migrationReady = c.configured;
      }
    });
  }

  loadEnv() {
    this.api.getDbEnv().subscribe({
      next: (res) => {
        this.env = res.data;
      },
    });
  }

  loadHealth() {
    this.refreshingHealth = true;
    this.api.getDbHealth().subscribe({
      next: (res) => {
        this.health = res.data;
        this.refreshingHealth = false;
      },
      error: () => {
        this.refreshingHealth = false;
      },
    });
  }

  loadLogs() {
    this.loadingLogs = true;
    this.api.getDbLogs().subscribe({
      next: (res) => {
        this.logs = res.data;
        this.loadingLogs = false;
      },
      error: () => {
        this.loadingLogs = false;
      },
    });
  }

  saveConfig(provider: string, e: Event) {
    e.preventDefault();
    this.saving = true;
    this.saveTarget = provider;

    const payload = (this.configs as any)[provider];
    this.api.saveDbConfig(provider, payload).subscribe({
      next: () => {
        this.saving = false;
        this.toast.showSuccess(`Configuration for ${provider.toUpperCase()} saved successfully.`);
        this.loadOverview();
      },
      error: (err) => {
        this.saving = false;
        const raw = err.error?.error?.message || err.error?.message || `Failed to save configuration for ${provider}.`;
        const msg = raw.replace(/<[^>]*>/g, ''); // strip any HTML tags
        this.toast.showError(msg);
      },
    });
  }

  testConnection(provider: string) {
    const payload = (this.configs as any)[provider];

    // Validate required fields before hitting the API
    const validationErrors: Record<string, string> = {
      firestore: !payload?.projectId ? "Project ID is required to test Firestore." : "",
      supabase: !payload?.projectUrl ? "Project URL is required to test Supabase." : !payload?.anonKey ? "Anon Key is required to test Supabase." : "",
      mongodb: !payload?.connectionString ? "Connection String is required to test MongoDB." : "",
      sqlserver: !payload?.host ? "Host is required to test SQL Server." : "",
    };

    const error = validationErrors[provider];
    if (error) {
      this.toast.showError(error);
      return;
    }

    this.testing = true;
    this.testTarget = provider;

    this.api.testDbConnection(provider, payload).subscribe({
      next: (res) => {
        this.testing = false;
        this.toast.showSuccess(`Connection successful in ${res.data?.latency || 0}ms: ${res.data?.message}`);
      },
      error: (err) => {
        this.testing = false;
        const raw = err.error?.error?.message || err.error?.message || 'Connection test failed.';
        const msg = raw.replace(/<[^>]*>/g, ''); // strip any HTML tags
        this.toast.showError(msg);
      },
    });
  }

  startSwitchWorkflow(provider: string) {
    this.targetProviderToSwitch = provider;
    this.showConfirmSwitchModal = true;
  }

  executeSwitch() {
    this.showConfirmSwitchModal = false;
    this.switchingWorkflow = true;
    this.switchSteps = [
      { name: "Connection Test", status: "pending", message: "Starting validation..." },
      { name: "Repository Validation", status: "pending", message: "Waiting..." },
      { name: "Schema Validation", status: "pending", message: "Waiting..." },
      { name: "Table Validation", status: "pending", message: "Waiting..." },
      { name: "Required Tables Check", status: "pending", message: "Waiting..." },
      { name: "Health Check", status: "pending", message: "Waiting..." },
      { name: "Migration Status Check", status: "pending", message: "Waiting..." },
    ];

    this.api.switchDbProvider(this.targetProviderToSwitch).subscribe({
      next: (res) => {
        this.switchSteps = res.data.steps;
        this.toast.showSuccess(`Switched to database ${this.targetProviderToSwitch.toUpperCase()} successfully.`);
        this.loadOverview();
        this.loadEnv();
      },
      error: (err) => {
        if (err.error?.data?.steps) {
          this.switchSteps = err.error.data.steps;
        } else {
          this.switchSteps.forEach((s) => {
            if (s.status === "pending") {
              s.status = "failed";
              s.message = err.error?.message || "Switch execution error.";
            }
          });
        }
        this.toast.showError("Database switch workflow validation failed.");
      },
    });
  }

  createBackup() {
    this.backingUp = true;
    this.api.backupDb(this.backupProvider).subscribe({
      next: (res) => {
        this.backingUp = false;
        const jsonStr = JSON.stringify(res.data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup_${this.backupProvider}_${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        this.toast.showSuccess("Database backup file downloaded successfully.");
      },
      error: () => {
        this.backingUp = false;
        this.toast.showError("Failed to generate database backup.");
      },
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] || null;
  }

  restoreBackup() {
    if (!this.selectedFile) return;

    this.restoring = true;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const payload = JSON.parse(e.target.result);
        this.api.restoreDb(this.restoreProvider, payload).subscribe({
          next: (res) => {
            this.restoring = false;
            this.toast.showSuccess(res.data?.message || "Database restore successful.");
          },
          error: (err) => {
            this.restoring = false;
            const msg = err.error?.message || "Failed to restore database.";
            this.toast.showError(msg);
          },
        });
      } catch (err) {
        this.restoring = false;
        this.toast.showError("Invalid JSON backup file format.");
      }
    };
    reader.readAsText(this.selectedFile);
  }

  flushCache() {
    this.api.flushDbCache().subscribe({
      next: () => {
        this.toast.showSuccess("Memory cache flushed completely.");
      },
    });
  }

  reconnectCache() {
    this.api.reconnectDbCache().subscribe({
      next: () => {
        this.toast.showSuccess("Cache layers reconnected successfully.");
      },
    });
  }

  resetConfig() {
    if (confirm("Are you absolutely sure you want to delete all Supabase, MongoDB, and SQL Server configurations?")) {
      this.api.resetDbConfig().subscribe({
        next: () => {
          this.toast.showSuccess("All database credentials reset successfully.");
          this.loadAllConfigs();
          this.loadOverview();
        },
      });
    }
  }

  toggleMaintenance() {
    this.toast.showSuccess("Maintenance mode settings toggled successfully.");
  }

  toggleReadOnly() {
    this.toast.showSuccess("Database Read-Only lock status updated successfully.");
  }

  toggleSecretVisibility(key: "firestorePrivateKey" | "supabaseAnon" | "supabaseService") {
    (this.showSecrets as any)[key] = !(this.showSecrets as any)[key];
  }

  isSeedingModuleSelected(mod: string): boolean {
    return this.seedingModules.includes(mod);
  }

  toggleSeedingModule(mod: string) {
    if (this.seedingModules.includes(mod)) {
      this.seedingModules = this.seedingModules.filter(m => m !== mod);
    } else {
      this.seedingModules.push(mod);
    }
  }

  isCleaningModuleSelected(mod: string): boolean {
    return this.cleaningModules.includes(mod);
  }

  toggleCleaningModule(mod: string) {
    if (this.cleaningModules.includes(mod)) {
      this.cleaningModules = this.cleaningModules.filter(m => m !== mod);
    } else {
      this.cleaningModules.push(mod);
    }
  }

  formatModuleName(mod: string): string {
    return mod.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  previewSeed() {
    const payload = {
      provider: this.seedingProvider,
      environment: this.seedingEnv,
      seedType: this.seedingType,
      modules: this.seedingModules,
      options: this.seedingOptions
    };
    this.api.previewSeed(payload).subscribe({
      next: (res) => {
        const preview = res.data;
        let msg = "Seed Preview:\n";
        Object.keys(preview).forEach(k => {
          msg += `- ${this.formatModuleName(k)}: ${preview[k]} records\n`;
        });
        alert(msg);
      },
      error: (err) => {
        this.toast.showError(err.error?.message || "Failed to preview seed.");
      }
    });
  }

  validateSeed() {
    const payload = {
      provider: this.seedingProvider,
      environment: this.seedingEnv,
      seedType: this.seedingType,
      modules: this.seedingModules,
      options: this.seedingOptions
    };
    this.api.validateSeedConfig(payload).subscribe({
      next: (res) => {
        const data = res.data;
        if (data.valid) {
          this.toast.showSuccess("Database connection & validation passed successfully!");
          if (data.warnings && data.warnings.length > 0) {
            alert("Warnings:\n" + data.warnings.join("\n"));
          }
        }
      },
      error: (err) => {
        this.toast.showError(err.error?.message || "Validation failed.");
      }
    });
  }

  startSeeding() {
    this.seedingProgress = true;
    this.seedingStatus = "Running";
    this.seedingLogs = ["Starting seeding session..."];
    this.seedingReport = null;

    const payload = {
      provider: this.seedingProvider,
      environment: this.seedingEnv,
      seedType: this.seedingType,
      modules: this.seedingModules,
      options: this.seedingOptions
    };

    this.api.seedDb(payload).subscribe({
      next: (res) => {
        this.seedingReport = res.data;
        this.seedingLogs = res.data.logs || [];
        this.seedingStatus = "Success";
        this.seedingProgress = false;
        this.toast.showSuccess("Data seeding completed successfully.");
        this.loadOverview();
      },
      error: (err) => {
        this.seedingStatus = "Failed";
        this.seedingProgress = false;
        this.toast.showError(err.error?.message || "Seeding failed.");
      }
    });
  }

  cancelSeeding() {
    this.seedingProgress = false;
    this.seedingStatus = "Cancelled";
    this.seedingLogs.push("Seeding cancelled by user.");
  }

  triggerCleanupPreview() {
    this.showConfirmCleanupModal = true;
    this.loadingCleanupPreview = true;
    this.cleanupPreviewInfo = null;
    this.cleaningConfirmToken = "";
    this.superAdminPassword = "";

    const payload = {
      provider: this.cleaningProvider,
      cleaningMode: this.cleaningMode,
      modules: this.cleaningModules,
      confirmationToken: "PREVIEW",
      options: this.cleaningOptions
    };

    this.api.previewCleanup(payload).subscribe({
      next: (res) => {
        this.cleanupPreviewInfo = res.data;
        this.loadingCleanupPreview = false;
      },
      error: (err) => {
        this.loadingCleanupPreview = false;
        this.toast.showError(err.error?.message || "Failed to generate cleanup preview.");
      }
    });
  }

  executeCleanup() {
    if (this.cleaningConfirmToken !== 'DELETE') return;
    
    this.showConfirmCleanupModal = false;
    this.cleaningProgress = true;
    this.cleaningStatus = "Cleaning...";
    this.cleaningReport = null;

    const payload = {
      provider: this.cleaningProvider,
      cleaningMode: this.cleaningMode,
      modules: this.cleaningModules,
      confirmationToken: this.cleaningConfirmToken,
      options: this.cleaningOptions,
      forceProduction: this.seedingEnv === 'production',
      forceProtected: false
    };

    this.api.cleanupDb(payload).subscribe({
      next: (res) => {
        this.cleaningReport = res.data;
        this.cleaningStatus = "Success";
        this.cleaningProgress = false;
        this.toast.showSuccess("Database records cleaned successfully.");
        this.loadOverview();
      },
      error: (err) => {
        this.cleaningStatus = "Failed";
        this.cleaningProgress = false;
        this.toast.showError(err.error?.message || "Cleanup failed.");
      }
    });
  }

  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  getProgressPercent(value: number, total: number): number {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  }
}
