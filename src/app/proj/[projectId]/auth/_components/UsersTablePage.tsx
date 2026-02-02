"use client";

import { AuthUserType } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const UsersTablePage = ({
  users
}: {
  projectId: string,
  users: AuthUserType[]
}) => {
  return (
    <div className='fullscreen flex flex-col'>
      <header className='h-12 min-h-12 max-h-12 flex flex-col'>
        <h1>Users</h1>

        <div className='flex items-center justify-between dark:bg-white/20 bg-white/80'>
          
        </div>
      </header>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Last Sign In</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Updated At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(u => (
            <TableRow key={u.phone}>
              <TableCell>{u.id}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.phone}</TableCell>
              <TableCell>{u.last_sign_in_at.toLocaleDateString()}</TableCell>
              <TableCell>{u.created_at.toLocaleDateString()}</TableCell>
              <TableCell>{u.updated_at.toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default UsersTablePage