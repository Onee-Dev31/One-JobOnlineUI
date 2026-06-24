import { Table, Tag, Card, List } from 'antd'
import { useQuery, useQueries } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import api from '../services/api'
import styles from './Roles.module.css'

interface Role {
  roleID: number
  roleName: string
}

interface Permission {
  id: number
  routePath: string
  sortOrder: number
}

const roleColor: Record<string, string> = {
  Admin: 'red',
  HR: 'blue',
  Requester: 'green',
  IT: 'purple',
}

export default function Roles() {
  const { data: roles = [], isPending } = useQuery<Role[]>({
    queryKey: ['/api/Roles'],
    queryFn: () => api.get('/api/Roles').then((r) => r.data),
  })

  const permResults = useQueries({
    queries: roles.map((role) => ({
      queryKey: ['/api/RolePermissions/by-role', role.roleName],
      queryFn: () =>
        api.get(`/api/RolePermissions/by-role/${role.roleName}`).then((r) => r.data as Permission[]),
      enabled: roles.length > 0,
    })),
  })

  const columns: ColumnsType<Role> = [
    {
      title: 'Role',
      dataIndex: 'roleName',
      key: 'roleName',
      render: (name: string) => (
        <Tag color={roleColor[name] ?? 'default'} className={styles.roleTag}>
          {name}
        </Tag>
      ),
    },
    {
      title: 'roleID',
      dataIndex: 'roleID',
      key: 'roleID',
      width: 80,
      render: (id: number) => <code>#{id}</code>,
    },
    {
      title: 'จำนวน Permissions',
      key: 'permCount',
      width: 160,
      render: (_, __, index) => {
        const count = permResults[index]?.data?.length ?? '—'
        return <span>{count} routes</span>
      },
    },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>Roles ({roles.length})</div>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={roles}
          rowKey="roleID"
          loading={isPending}
          pagination={false}
          size="middle"
          expandable={{
            expandedRowRender: (_, index) => {
              const perms: Permission[] = permResults[index]?.data ?? []
              const loading = permResults[index]?.isPending ?? false
              return (
                <List
                  loading={loading}
                  size="small"
                  dataSource={[...perms].sort((a, b) => a.sortOrder - b.sortOrder)}
                  renderItem={(p) => (
                    <List.Item className={styles.permItem}>
                      <span className={styles.sortOrder}>#{p.sortOrder}</span>
                      <code className={styles.routePath}>{p.routePath}</code>
                    </List.Item>
                  )}
                  locale={{ emptyText: 'ไม่มี permissions' }}
                />
              )
            },
            rowExpandable: () => true,
          }}
        />
      </Card>
    </div>
  )
}
