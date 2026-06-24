import { useState } from 'react'
import { Table, Tag, Input, Select, Card, Button, Switch, Modal, Form, App } from 'antd'
import { SearchOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import api from '../services/api'
import styles from './AdminUsers.module.css'

interface AdminUser {
  adminID: number
  username: string
  email?: string
  department: string
  empNo: string
  nameThai?: string
  mobile?: string
  position?: string
  companyName?: string
  roleID: number
  isActive: boolean
  updatedDate?: string
  role: string
}

interface Role {
  roleID: number
  roleName: string
}

const roleColor: Record<string, string> = {
  Admin: 'red',
  HR: 'blue',
  Requester: 'green',
  IT: 'purple',
}

export default function AdminUsers() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<number | undefined>()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const { data: users = [], isPending } = useQuery<AdminUser[]>({
    queryKey: ['/api/AdminUsers'],
    queryFn: () => api.get('/api/AdminUsers').then((r) => r.data),
  })

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['/api/Roles'],
    queryFn: () => api.get('/api/Roles').then((r) => r.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['/api/AdminUsers'] })

  const { mutate: toggleActive } = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      api.patch(`/api/AdminUsers/${id}/active`, { isActive }),
    onSuccess: () => { message.success('อัปเดตสถานะสำเร็จ'); invalidate() },
    onError: () => message.error('อัปเดตสถานะไม่สำเร็จ'),
  })

  const { mutate: createUser, isPending: isCreating } = useMutation({
    mutationFn: (body: object) => api.post('/api/AdminUsers', body),
    onSuccess: () => { message.success('เพิ่มผู้ใช้สำเร็จ'); invalidate(); closeModal() },
    onError: () => message.error('เพิ่มผู้ใช้ไม่สำเร็จ'),
  })

  const { mutate: updateUser, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) =>
      api.put(`/api/AdminUsers/${id}`, body),
    onSuccess: () => { message.success('แก้ไขสำเร็จ'); invalidate(); closeModal() },
    onError: () => message.error('แก้ไขไม่สำเร็จ'),
  })

  const openAdd = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (user: AdminUser) => {
    setEditing(user)
    form.setFieldsValue(user)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    form.resetFields()
  }

  const handleSubmit = (values: object) => {
    if (editing) {
      updateUser({ id: editing.adminID, body: values })
    } else {
      createUser(values)
    }
  }

  const filtered = users.filter((u) => {
    const text = `${u.username} ${u.nameThai ?? ''} ${u.email ?? ''}`.toLowerCase()
    const matchSearch = text.includes(search.toLowerCase())
    const matchRole = !roleFilter || u.roleID === roleFilter
    return matchSearch && matchRole
  })

  const columns: ColumnsType<AdminUser> = [
    {
      title: 'ผู้ใช้',
      key: 'user',
      render: (_, r) => (
        <div>
          <div className={styles.username}>{r.username}</div>
          <div className={styles.sub}>{r.nameThai ?? ''}{r.email ? ` · ${r.email}` : ''}</div>
        </div>
      ),
    },
    {
      title: 'แผนก / รหัสพนักงาน',
      key: 'dept',
      width: 180,
      render: (_, r) => (
        <div>
          <div>{r.department}</div>
          <div className={styles.sub}>{r.empNo}</div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 110,
      render: (role: string) => (
        <Tag color={roleColor[role] ?? 'default'}>{role}</Tag>
      ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      align: 'center',
      render: (active: boolean, record) => (
        <Switch
          checked={active}
          size="small"
          onChange={(val) => toggleActive({ id: record.adminID, isActive: val })}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <div className={styles.actions}>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          />
        </div>
      ),
    },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>Admin Users ({users.length})</div>
        <div className={styles.toolbar}>
          <Select
            className={styles.filterSelect}
            placeholder="กรอง Role"
            allowClear
            value={roleFilter}
            onChange={setRoleFilter}
            options={roles.map((r) => ({ value: r.roleID, label: r.roleName }))}
          />
          <Input
            prefix={<SearchOutlined />}
            placeholder="ค้นหา username / ชื่อ"
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            เพิ่มผู้ใช้
          </Button>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="adminID"
          loading={isPending}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          size="middle"
        />
      </Card>

      <Modal
        title={editing ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editing ? 'บันทึก' : 'เพิ่ม'}
        cancelText="ยกเลิก"
        confirmLoading={isCreating || isUpdating}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          {!editing && (
            <Form.Item name="username" label="Username" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          )}
          <Form.Item name="nameThai" label="ชื่อ (ภาษาไทย)">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="department" label="แผนก">
            <Input />
          </Form.Item>
          {!editing && (
            <Form.Item name="empNo" label="รหัสพนักงาน">
              <Input />
            </Form.Item>
          )}
          <Form.Item name="mobile" label="เบอร์โทร">
            <Input />
          </Form.Item>
          <Form.Item name="roleID" label="Role" rules={[{ required: true }]}>
            <Select
              options={roles.map((r) => ({ value: r.roleID, label: r.roleName }))}
              placeholder="เลือก Role"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
