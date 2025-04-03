import React from 'react';
import Link from 'next/link';

const AdminDashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">管理者ダッシュボード</h1>
      <ul className="space-y-4">
        <li>
          <Link href="/admin/products">
            <a className="text-blue-500 hover:underline">製品管理</a>
          </Link>
        </li>
        <li>
          <Link href="/admin/users">
            <a className="text-blue-500 hover:underline">ユーザー管理</a>
          </Link>
        </li>
        <li>
          <Link href="/admin/settings">
            <a className="text-blue-500 hover:underline">設定</a>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default AdminDashboard;