import { useState } from 'react'
import { Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined, BankOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import styles from './Login.module.css'

interface LoginForm {
  username: string
  password: string
}

export default function Login() {
  const [form] = Form.useForm<LoginForm>()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (values: LoginForm) => {
    setLoading(true)
    try {
      const { data } = await api.post('/api/LoginAdminNew/LoginAD', values)
      localStorage.setItem('token', data.accessToken)
      navigate('/dashboard')
    } catch {
      message.error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      {/* Left panel */}
      <div className={styles.leftPanel}>
        <div className={`${styles.circle} ${styles.circle1}`} />
        <div className={`${styles.circle} ${styles.circle2}`} />
        <div className={`${styles.circle} ${styles.circle3}`} />

        <div className={styles.leftContent}>
          <div className={styles.iconBox}>
            <BankOutlined className={styles.brandIcon} />
          </div>
          <div className={styles.brandName}>One Job</div>
          <div className={styles.brandTagline}>
            ระบบจัดการงานและผู้สมัครงาน
            <br />
            สำหรับผู้ดูแลระบบ
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className={styles.rightPanel}>
        <div className={styles.formWrapper}>
          <div className={styles.formHeader}>
            <div className={styles.formTitle}>เข้าสู่ระบบ</div>
            <div className={styles.formSubtitle}>กรุณาใส่ข้อมูลเพื่อเข้าใช้งาน</div>
          </div>

          <Form form={form} onFinish={handleSubmit} layout="vertical" requiredMark={false}>
            <Form.Item
              label={<span className={styles.fieldLabel}>ชื่อผู้ใช้</span>}
              name="username"
              rules={[{ required: true, message: 'กรุณาใส่ชื่อผู้ใช้' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="ชื่อผู้ใช้"
                size="large"
                className={styles.inputRounded}
              />
            </Form.Item>

            <Form.Item
              label={<span className={styles.fieldLabel}>รหัสผ่าน</span>}
              name="password"
              rules={[{ required: true, message: 'กรุณาใส่รหัสผ่าน' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="รหัสผ่าน"
                size="large"
                className={styles.inputRounded}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                className={styles.submitBtn}
              >
                เข้าสู่ระบบ
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div className={styles.copyright}>© 2025 One Job. All rights reserved.</div>
      </div>
    </div>
  )
}
