import { StatsOverview } from "@/components/stats-overview";
import { RecentScripts } from "@/components/recent-scripts";
import { BotManagement } from "@/components/bot-management";
import { ActivityLog } from "@/components/activity-log";
import { ScriptDetailsModal } from "@/components/script-details-modal";
import { useState } from "react";

export default function Dashboard() {
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <i className="fas fa-shield-alt text-xl"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">بوت حماية السكربتات</h1>
                <p className="text-sm text-gray-600">Lua Script Protection Bot</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">متصل</span>
              </div>
              <div className="relative">
                <button className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                  <i className="fas fa-bell text-gray-600"></i>
                </button>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <StatsOverview />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Scripts */}
          <div className="lg:col-span-2">
            <RecentScripts onScriptSelect={setSelectedScriptId} />
          </div>

          {/* Bot Management */}
          <div>
            <BotManagement />
          </div>
        </div>

        {/* Activity Log */}
        <ActivityLog />
      </div>

      {/* Script Details Modal */}
      <ScriptDetailsModal 
        scriptId={selectedScriptId} 
        onClose={() => setSelectedScriptId(null)} 
      />
    </div>
  );
}
