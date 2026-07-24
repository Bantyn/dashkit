import { environment } from '../../../environments/environment';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SparklineChartComponent } from '../../shared/components/sparkline-chart.component';

export interface LiveRequestLog {
  timestamp: string;
  method: string;
  endpoint: string;
  statusCode: number;
  responseTime: number;
  shopId: string;
  branchId: string;
  supabaseReads: number;
  supabaseWrites: number;
  firestoreReads: number;
  firestoreWrites: number;
  cacheHits: number;
  cacheMisses: number;
  databaseProvider: string;
  success: boolean;
}

@Component({
  selector: 'app-live-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule, SparklineChartComponent],
  template: `
    <div class="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">
      <!-- Unified Header row -->
      <div class="flex bg-white border-b border-gray-200 shrink-0 z-30">
        <div class="flex-1 px-6 py-5 flex justify-between items-center min-w-0">
          <div>
            <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
              System Live Monitoring
              <div class="relative flex h-3 w-3 ml-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      [ngClass]="socketConnected ? 'bg-emerald-400' : 'bg-rose-400'"></span>
                <span class="relative inline-flex rounded-full h-3 w-3"
                      [ngClass]="socketConnected ? 'bg-emerald-500' : 'bg-rose-500'"></span>
              </div>
            </h2>
            <p class="text-xs text-gray-500 mt-1">
              Live in-memory server diagnostics and real-time request streaming. Connection: 
              <span class="font-bold uppercase" [ngClass]="socketConnected ? 'text-emerald-600' : 'text-rose-600'">
                {{ socketConnected ? 'Connected' : 'Disconnected (Retrying...)' }}
              </span>
            </p>
          </div>
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary-50 text-primary-600 border border-primary-100">
              Uptime: {{ formatUptime(metrics?.serverUptime || 0) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex overflow-hidden">
        <div class="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-50 space-y-6">
          
          <!-- Top Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Active Requests Card -->
            <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Requests</span>
                <div class="p-2 bg-primary-50 text-primary-600 rounded-lg"><i class="bi bi-activity text-lg"></i></div>
              </div>
              <div class="mt-4 flex items-baseline gap-2">
                <span class="text-2xl font-black text-gray-900 font-mono">{{ metrics?.activeRequests || 0 }}</span>
              </div>
              <div class="absolute bottom-0 left-0 right-0 h-1 bg-primary-500"></div>
            </div>

            <!-- Requests Rate Card -->
            <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Throughput</span>
                <div class="p-2 bg-blue-50 text-blue-600 rounded-lg"><i class="bi bi-speedometer text-lg"></i></div>
              </div>
              <div class="mt-4 flex items-baseline gap-2">
                <span class="text-2xl font-black text-gray-900 font-mono">{{ metrics?.requestsPerSecond || 0 }}</span>
                <span class="text-xs text-gray-400 font-medium">req/sec</span>
              </div>
              <div class="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
            </div>

            <!-- Avg Response Time Card -->
            <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Response Time</span>
                <div class="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><i class="bi bi-clock-history text-lg"></i></div>
              </div>
              <div class="mt-4 flex items-baseline gap-2">
                <span class="text-2xl font-black text-gray-900 font-mono">{{ metrics?.avgResponseTime || 0 }}</span>
                <span class="text-xs text-gray-400 font-medium">ms</span>
                <span class="text-[10px] text-gray-400 font-medium ml-auto">P95: {{ metrics?.p95ResponseTime || 0 }} ms</span>
              </div>
              <div class="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
            </div>

            <!-- System Health Rates Card -->
            <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Success / Errors</span>
                <div class="p-2 bg-rose-50 text-rose-600 rounded-lg"><i class="bi bi-shield-exclamation text-lg"></i></div>
              </div>
              <div class="mt-4 flex items-baseline justify-between">
                <div>
                  <span class="text-2xl font-black text-emerald-600 font-mono">{{ metrics?.successRate || 100 }}%</span>
                  <span class="block text-[9px] text-gray-400 font-medium">Success Rate</span>
                </div>
                <div class="text-right">
                  <span class="text-2xl font-black text-rose-600 font-mono">{{ metrics?.errorRate || 0 }}%</span>
                  <span class="block text-[9px] text-gray-400 font-medium">Error Rate</span>
                </div>
              </div>
              <div class="absolute bottom-0 left-0 right-0 h-1 bg-rose-500"></div>
            </div>
          </div>

          <!-- Infrastructure & DB Metrics Row -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Server Memory / CPU Status -->
            <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 class="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Infrastructure Stats</h3>
              
              <div class="space-y-3">
                <div>
                  <div class="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                    <span>CPU Usage</span>
                    <span>{{ metrics?.cpuUsage || 0 }}%</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full h-2">
                    <div class="bg-primary-500 h-2 rounded-full transition-all" [style.width.%]="metrics?.cpuUsage || 0"></div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                    <span>Memory usage (RSS)</span>
                    <span>{{ metrics?.memoryUsageMB || 0 }} MB</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full h-2">
                    <div class="bg-blue-500 h-2 rounded-full transition-all" [style.width.%]="Math.min(100, ((metrics?.memoryUsageMB || 0) / 2048) * 100)"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- DB Metrics Card -->
            <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3 lg:col-span-2">
              <h3 class="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Database & Cache Metrics (In Window)</h3>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span class="block text-[10px] text-gray-400 font-bold uppercase">Supabase Ops</span>
                  <span class="text-base font-black text-gray-800 font-mono">
                    R: {{ metrics?.supabaseReads || 0 }} | W: {{ metrics?.supabaseWrites || 0 }}
                  </span>
                </div>
                <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span class="block text-[10px] text-gray-400 font-bold uppercase">Firestore Ops</span>
                  <span class="text-base font-black text-gray-800 font-mono">
                    R: {{ metrics?.firestoreReads || 0 }} | W: {{ metrics?.firestoreWrites || 0 }}
                  </span>
                </div>
                <div class="bg-gray-50 p-3 rounded-xl border border-gray-100 col-span-2 md:col-span-1">
                  <span class="block text-[10px] text-gray-400 font-bold uppercase">Cache Hit Rate</span>
                  <span class="text-base font-black text-emerald-600 font-mono">
                    {{ metrics?.cacheHitRate || 100 }}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Real-Time Metrics Sparkline Charts Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- RPS Chart -->
            <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-40">
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Requests / Sec</span>
                  <h4 class="text-lg font-black font-mono text-gray-900">{{ metrics?.requestsPerSecond || 0 }}</h4>
                </div>
                <span class="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-blue-100">1s Ticks</span>
              </div>
              <div class="w-full flex justify-center py-2">
                <app-sparkline [data]="rpsHistory" color="#3B82F6" [width]="320" [height]="60"></app-sparkline>
              </div>
            </div>

            <!-- Latency Chart -->
            <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-40">
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Response Time (ms)</span>
                  <h4 class="text-lg font-black font-mono text-gray-900">{{ metrics?.avgResponseTime || 0 }}</h4>
                </div>
                <span class="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-emerald-100">Rolling Avg</span>
              </div>
              <div class="w-full flex justify-center py-2">
                <app-sparkline [data]="latencyHistory" color="#10B981" [width]="320" [height]="60"></app-sparkline>
              </div>
            </div>

            <!-- DB Reads Chart -->
            <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-40">
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">DB Reads / Sec</span>
                  <h4 class="text-lg font-black font-mono text-gray-900">{{ (metrics?.supabaseReads || 0) + (metrics?.firestoreReads || 0) }}</h4>
                </div>
                <span class="text-[9px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-purple-100">All DBs</span>
              </div>
              <div class="w-full flex justify-center py-2">
                <app-sparkline [data]="dbReadsHistory" color="#8B5CF6" [width]="320" [height]="60"></app-sparkline>
              </div>
            </div>

            <!-- DB Writes Chart -->
            <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-40">
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">DB Writes / Sec</span>
                  <h4 class="text-lg font-black font-mono text-gray-900">{{ (metrics?.supabaseWrites || 0) + (metrics?.firestoreWrites || 0) }}</h4>
                </div>
                <span class="text-[9px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-amber-100">All DBs</span>
              </div>
              <div class="w-full flex justify-center py-2">
                <app-sparkline [data]="dbWritesHistory" color="#F59E0B" [width]="320" [height]="60"></app-sparkline>
              </div>
            </div>

            <!-- Cache Hit Rate Chart -->
            <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-40">
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Cache Efficiency</span>
                  <h4 class="text-lg font-black font-mono text-gray-900">{{ metrics?.cacheHitRate || 100 }}%</h4>
                </div>
                <span class="text-[9px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-teal-100">Hit Rate</span>
              </div>
              <div class="w-full flex justify-center py-2">
                <app-sparkline [data]="cacheHitRateHistory" color="#14B8A6" [width]="320" [height]="60"></app-sparkline>
              </div>
            </div>

            <!-- Errors Rate Chart -->
            <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-40">
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Errors Rate (%)</span>
                  <h4 class="text-lg font-black font-mono text-rose-600">{{ metrics?.errorRate || 0 }}%</h4>
                </div>
                <span class="text-[9px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-rose-100">Failing Requests</span>
              </div>
              <div class="w-full flex justify-center py-2">
                <app-sparkline [data]="errorsHistory" color="#EF4444" [width]="320" [height]="60"></app-sparkline>
              </div>
            </div>
          </div>

          <!-- Filters & Live Requests Table -->
          <div class="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden flex flex-col">
            <!-- Filter Controls -->
            <div class="p-4 border-b border-gray-100 shrink-0 flex gap-4 flex-col md:flex-row items-center justify-between">
              <h3 class="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider">
                Live Stream <span class="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-bold border border-gray-200">{{ filteredRequests.length }} visible</span>
              </h3>

              <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <!-- Search Endpoints -->
                <div class="relative">
                  <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input type="text" [(ngModel)]="filterEndpoint" placeholder="Filter Endpoint..."
                         class="pl-9 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 rounded-lg text-xs transition-all outline-none w-44">
                </div>
                
                <!-- Search Shop ID -->
                <input type="text" [(ngModel)]="filterShop" placeholder="Shop ID..."
                       class="px-3 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 rounded-lg text-xs transition-all outline-none w-32">

                <!-- Method -->
                <select [(ngModel)]="filterMethod"
                        class="px-3 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 rounded-lg text-xs transition-all outline-none">
                  <option value="ALL">All Methods</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>

                <!-- Status -->
                <select [(ngModel)]="filterStatus"
                        class="px-3 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-primary-100 rounded-lg text-xs transition-all outline-none">
                  <option value="ALL">All Statuses</option>
                  <option value="2xx">2xx/3xx (Ok)</option>
                  <option value="4xx">4xx (Client Err)</option>
                  <option value="5xx">5xx (Server Err)</option>
                </select>
              </div>
            </div>

            <!-- Table Container -->
            <div class="overflow-x-auto max-h-[420px] overflow-y-auto custom-scrollbar">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-wider sticky top-0 z-10">
                    <th class="px-5 py-3">Timestamp</th>
                    <th class="px-5 py-3">Method</th>
                    <th class="px-5 py-3">Endpoint</th>
                    <th class="px-5 py-3 text-center">Status</th>
                    <th class="px-5 py-3 text-right">Latency</th>
                    <th class="px-5 py-3">Shop ID</th>
                    <th class="px-5 py-3 text-center">Supabase R/W</th>
                    <th class="px-5 py-3 text-center">Firestore R/W</th>
                    <th class="px-5 py-3 text-center">Active DB</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 font-mono text-xs text-gray-700">
                  <tr *ngFor="let req of filteredRequests; trackBy: trackByTimestamp" 
                      class="hover:bg-gray-50/60 transition-colors group animate-fade-in">
                    <!-- Timestamp -->
                    <td class="px-5 py-3.5 text-gray-400">
                      {{ req.timestamp | date:'HH:mm:ss.SSS' }}
                    </td>
                    <!-- Method -->
                    <td class="px-5 py-3.5">
                      <span class="px-2 py-0.5 rounded text-[10px] font-black tracking-wider"
                            [ngClass]="{
                              'bg-blue-50 text-blue-600 border border-blue-100': req.method === 'GET',
                              'bg-emerald-50 text-emerald-600 border border-emerald-100': req.method === 'POST',
                              'bg-amber-50 text-amber-600 border border-amber-100': req.method === 'PUT',
                              'bg-purple-50 text-purple-600 border border-purple-100': req.method === 'PATCH',
                              'bg-rose-50 text-rose-600 border border-rose-100': req.method === 'DELETE'
                            }">
                        {{ req.method }}
                      </span>
                    </td>
                    <!-- Endpoint -->
                    <td class="px-5 py-3.5 font-sans font-medium text-gray-900 truncate max-w-xs" [title]="req.endpoint">
                      {{ req.endpoint }}
                    </td>
                    <!-- Status -->
                    <td class="px-5 py-3.5 text-center">
                      <span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                            [ngClass]="{
                              'bg-emerald-50 text-emerald-700 border-emerald-100': req.statusCode >= 200 && req.statusCode < 400,
                              'bg-amber-50 text-amber-700 border-amber-100': req.statusCode >= 400 && req.statusCode < 500,
                              'bg-rose-50 text-rose-700 border-rose-100': req.statusCode >= 500
                            }">
                        {{ req.statusCode }}
                      </span>
                    </td>
                    <!-- Latency -->
                    <td class="px-5 py-3.5 text-right font-bold"
                        [ngClass]="req.responseTime > 500 ? 'text-rose-600' : req.responseTime > 200 ? 'text-amber-500' : 'text-emerald-500'">
                      {{ req.responseTime }}ms
                    </td>
                    <!-- Shop ID -->
                    <td class="px-5 py-3.5 text-gray-500 font-semibold truncate max-w-[100px]" [title]="req.shopId">
                      {{ req.shopId || '—' }}
                    </td>
                    <!-- Supabase Reads / Writes -->
                    <td class="px-5 py-3.5 text-center text-gray-500">
                      <span [class.font-bold]="req.supabaseReads > 0" [class.text-blue-600]="req.supabaseReads > 0">{{ req.supabaseReads }}</span>
                      <span class="text-gray-300">/</span>
                      <span [class.font-bold]="req.supabaseWrites > 0" [class.text-amber-600]="req.supabaseWrites > 0">{{ req.supabaseWrites }}</span>
                    </td>
                    <!-- Firestore Reads / Writes -->
                    <td class="px-5 py-3.5 text-center text-gray-500">
                      <span [class.font-bold]="req.firestoreReads > 0" [class.text-blue-600]="req.firestoreReads > 0">{{ req.firestoreReads }}</span>
                      <span class="text-gray-300">/</span>
                      <span [class.font-bold]="req.firestoreWrites > 0" [class.text-amber-600]="req.firestoreWrites > 0">{{ req.firestoreWrites }}</span>
                    </td>
                    <!-- Active DB Provider -->
                    <td class="px-5 py-3.5 text-center">
                      <span class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                            [ngClass]="{
                              'bg-orange-50 text-orange-600 border-orange-200': req.databaseProvider === 'firestore',
                              'bg-emerald-50 text-emerald-600 border-emerald-200': req.databaseProvider === 'supabase',
                              'bg-blue-50 text-blue-600 border-blue-200': req.databaseProvider === 'mongodb',
                              'bg-indigo-50 text-indigo-600 border-indigo-200': req.databaseProvider === 'sqlserver',
                              'bg-gray-50 text-gray-600 border-gray-200': !req.databaseProvider
                            }">
                        {{ req.databaseProvider || 'NONE' }}
                      </span>
                    </td>
                  </tr>
                  <!-- Empty Row state -->
                  <tr *ngIf="filteredRequests.length === 0">
                    <td colspan="9" class="text-center py-12 text-gray-400 font-sans">
                      <div class="flex flex-col items-center justify-center gap-2">
                        <i class="bi bi-activity text-3xl"></i>
                        <p class="text-sm">No live matching requests streamed yet...</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class LiveMonitoringComponent implements OnInit, OnDestroy {
  Math = Math;
  
  socketConnected = false;
  socket: WebSocket | null = null;
  requests: LiveRequestLog[] = [];
  metrics: any = null;

  // Filter bindings
  filterMethod = 'ALL';
  filterStatus = 'ALL';
  filterShop = '';
  filterEndpoint = '';

  // Chart data histories (rolling 30 ticks)
  rpsHistory: number[] = Array(30).fill(0);
  latencyHistory: number[] = Array(30).fill(0);
  dbReadsHistory: number[] = Array(30).fill(0);
  dbWritesHistory: number[] = Array(30).fill(0);
  cacheHitRateHistory: number[] = Array(30).fill(0);
  errorsHistory: number[] = Array(30).fill(0);

  ngOnInit() {
    this.connectWebSocket();
  }

  ngOnDestroy() {
    if (this.socket) {
      this.socket.close();
    }
  }

  connectWebSocket() {
    const apiBaseUrl = environment.publicApiUrl || '';
    let wsUrl: string;

    if (apiBaseUrl.startsWith('http')) {
      const wsProtocol = apiBaseUrl.startsWith('https') ? 'wss:' : 'ws:';
      try {
        const url = new URL(apiBaseUrl);
        wsUrl = `${wsProtocol}//${url.host}/live-monitoring`;
      } catch (e) {
        // Fallback in case of parsing error
        const wsHost = window.location.hostname;
        const wsPort = '3003';
        wsUrl = `${wsProtocol}//${wsHost}:${wsPort}/live-monitoring`;
      }
    } else {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.hostname;
      const wsPort = '3003';
      wsUrl = `${wsProtocol}//${wsHost}:${wsPort}/live-monitoring`;
    }

    console.log(`Connecting Live Monitoring WS: ${wsUrl}`);
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WS Live Monitoring connected');
      this.socketConnected = true;
    };

    this.socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'initial') {
          this.requests = payload.data.recentRequests || [];
          this.metrics = payload.data.metrics || null;
        } else if (payload.type === 'request') {
          this.requests.unshift(payload.data);
          if (this.requests.length > 500) {
            this.requests.pop();
          }
        } else if (payload.type === 'metrics') {
          this.metrics = payload.data;
          this.pushChartData(payload.data);
        } else if (payload.type === 'activeRequests') {
          if (this.metrics) {
            this.metrics.activeRequests = payload.data.activeRequests;
          }
        }
      } catch (err) {
        console.error('Failed to parse WS message:', err);
      }
    };

    this.socket.onclose = () => {
      console.warn('WS Live Monitoring disconnected. Reconnecting in 3s...');
      this.socketConnected = false;
      setTimeout(() => this.connectWebSocket(), 3000);
    };

    this.socket.onerror = (err) => {
      console.error('WS Error:', err);
    };
  }

  pushChartData(metrics: any) {
    this.rpsHistory = [...this.rpsHistory.slice(1), metrics.requestsPerSecond];
    this.latencyHistory = [...this.latencyHistory.slice(1), metrics.avgResponseTime];
    
    const dbReads = (metrics.supabaseReads || 0) + (metrics.firestoreReads || 0);
    this.dbReadsHistory = [...this.dbReadsHistory.slice(1), dbReads];
    
    const dbWrites = (metrics.supabaseWrites || 0) + (metrics.firestoreWrites || 0);
    this.dbWritesHistory = [...this.dbWritesHistory.slice(1), dbWrites];
    
    this.cacheHitRateHistory = [...this.cacheHitRateHistory.slice(1), metrics.cacheHitRate];
    this.errorsHistory = [...this.errorsHistory.slice(1), metrics.errorRate];
  }

  get filteredRequests(): LiveRequestLog[] {
    return this.requests.filter(req => {
      if (this.filterMethod !== 'ALL' && req.method !== this.filterMethod) return false;
      if (this.filterStatus !== 'ALL') {
        const firstChar = String(req.statusCode).charAt(0);
        if (this.filterStatus === '2xx' && firstChar !== '2' && firstChar !== '3') return false;
        if (this.filterStatus === '4xx' && firstChar !== '4') return false;
        if (this.filterStatus === '5xx' && firstChar !== '5') return false;
      }
      if (this.filterShop && !req.shopId.toLowerCase().includes(this.filterShop.toLowerCase())) return false;
      if (this.filterEndpoint && !req.endpoint.toLowerCase().includes(this.filterEndpoint.toLowerCase())) return false;
      return true;
    });
  }

  formatUptime(seconds: number): string {
    if (!seconds) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  trackByTimestamp(index: number, item: LiveRequestLog) {
    return item.timestamp + '-' + item.endpoint;
  }
}
