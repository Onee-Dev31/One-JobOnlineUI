import { Form, Input, Button, App } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '../../services/api'
import styles from './ApplicantLogin.module.css'

interface LoginForm {
  email: string
  password: string
}

export default function ApplicantLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { message } = App.useApp()

  const from = (location.state as { from?: string })?.from ?? '/app/jobs'

  const { mutate: login, isPending } = useMutation({
    mutationFn: (values: LoginForm) =>
      api.post('/api/Login', { username: values.email, password: values.password, jobID: null }),
    onSuccess: (res) => {
      localStorage.setItem('applicantToken', res.data.accessToken)
      navigate(from, { replace: true })
    },
    onError: () => message.error('อีเมลหรือรหัสผ่านไม่ถูกต้อง'),
  })

  return (
    <div className={styles.page}>
      {/* Left branding panel */}
      <div className={styles.left}>
        <button
          type="button"
          className={styles.logoGroup}
          onClick={() => navigate('/app/jobs')}
        >
          <div className={styles.logoMark}>T1</div>
          <div className={styles.logoText}>
            <span className={styles.logoName}>The One Enterprise</span>
            <span className={styles.logoSub}>Career Portal</span>
          </div>
        </button>

        <div className={styles.leftBody}>
          <div className={styles.leftTitle}>
            ค้นหางานที่ใช่<br />
            กับ The One Enterprise
          </div>
          <div className={styles.leftSub}>
            ผู้นำด้าน Content &amp; Distribution ระดับประเทศ<br />
            เปิดรับผู้ที่มีไฟ พร้อมเติบโตไปด้วยกัน
          </div>
          <div className={styles.leftStats}>
            <div className={styles.leftStat}>
              <span className={styles.leftStatNum}>50+</span>
              <span className={styles.leftStatLabel}>ตำแหน่งงาน</span>
            </div>
            <div className={styles.leftStatDivider} />
            <div className={styles.leftStat}>
              <span className={styles.leftStatNum}>10+</span>
              <span className={styles.leftStatLabel}>แผนก</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className={styles.right}>
        <div className={styles.formWrap}>
          <div className={styles.formTitle}>เข้าสู่ระบบ</div>
          <div className={styles.formSub}>ยินดีต้อนรับกลับมา</div>

          <Form layout="vertical" onFinish={login} className={styles.form}>
            <Form.Item
              name="email"
              label="อีเมล"
              rules={[
                { required: true, message: 'กรุณากรอกอีเมล' },
                { type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' },
              ]}
            >
              <Input size="large" placeholder="email@example.com" autoComplete="email" />
            </Form.Item>

            <Form.Item
              name="password"
              label="รหัสผ่าน"
              rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน' }]}
            >
              <Input.Password size="large" placeholder="รหัสผ่าน" autoComplete="current-password" />
            </Form.Item>

            <Form.Item className={styles.submitItem}>
              <Button type="primary" htmlType="submit" size="large" block loading={isPending}>
                เข้าสู่ระบบ
              </Button>
            </Form.Item>
          </Form>

          <div className={styles.dividerText}>หรือ</div>

          <div className={styles.registerLink}>
            ยังไม่มีบัญชี?{' '}
            <button
              type="button"
              className={styles.registerBtn}
              onClick={() => navigate('/app/register')}
            >
              สมัครสมาชิก
            </button>
          </div>

          <button
            type="button"
            className={styles.backToJobs}
            onClick={() => navigate('/app/jobs')}
          >
            ← กลับหน้ารายการงาน
          </button>
        </div>
      </div>
    </div>
  )
}
