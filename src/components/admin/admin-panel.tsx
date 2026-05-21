'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserList } from './user-list';
import { DepartmentList } from './department-list';
import { PendingList } from './pending-list';
import { CreateUserDialog } from './create-user-dialog';
import type { PendingUser, UserWithMembership } from '@/lib/admin/actions';
import type { Department } from '@/types/database';

interface AdminPanelProps {
  users: UserWithMembership[];
  departments: (Department & { memberCount: number })[];
  pendingUsers: PendingUser[];
  currentUserId: string;
}

export function AdminPanel({
  users,
  departments,
  pendingUsers,
  currentUserId,
}: AdminPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Verwaltung</h1>
      </div>
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="users" className="flex-1 min-h-[48px]">
            Nutzer ({users.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex-1 min-h-[48px]">
            Freigaben ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex-1 min-h-[48px]">
            Abteilungen ({departments.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <CreateUserDialog departments={departments} />
          </div>
          <UserList
            users={users}
            departments={departments}
            currentUserId={currentUserId}
          />
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <PendingList users={pendingUsers} departments={departments} />
        </TabsContent>
        <TabsContent value="departments" className="mt-4">
          <DepartmentList departments={departments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
