import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { SidebarNavigation } from '@/components/layout/sidebar-navigation';
import { AIChatInterface } from '@/components/chat/ai-chat-interface';
import { FileExplorer } from '@/components/file-manager/file-explorer';
import { TerminalEmulator } from '@/components/terminal/terminal-emulator';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  const user = {
    name: session.user?.name || 'User',
    email: session.user?.email || 'user@example.com',
    avatar: session.user?.image
  };

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <SidebarNavigation user={user} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Dashboard Overview */}
        <div className="flex-1 p-6 overflow-y-auto">
          <DashboardOverview />
        </div>
      </div>

      {/* Right Panel - AI Chat & Tools */}
      <div className="w-80 flex-shrink-0 border-l bg-card flex flex-col">
        {/* AI Chat Interface */}
        <div className="flex-1 p-4">
          <AIChatInterface />
        </div>

        {/* Quick File Explorer */}
        <div className="h-64 p-4 border-t">
          <div className="h-full">
            <FileExplorer 
              className="h-full"
              allowCreate={false}
              allowDelete={false}
            />
          </div>
        </div>

        {/* Mini Terminal */}
        <div className="h-48 p-4 border-t">
          <div className="h-full">
            <TerminalEmulator 
              className="h-full"
              isConnected={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}