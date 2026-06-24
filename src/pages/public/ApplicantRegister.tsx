import { useState } from 'react'
import { Form, Input, Button, App } from 'antd'
import { MailOutlined, SafetyOutlined, LockOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '../../services/api'
import styles from './ApplicantRegister.module.css'

type Step = 'email' | 'otp' | 'password' | 'done'

export default function ApplicantRegister() {
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')

  const [emailForm] = Form.useForm()
  const [otpForm] = Form.useForm()
  const [pwForm] = Form.useForm()

  // Step 1: request OTP
  const { mutate: requestOtp, isPending: requestingOtp } = useMutation({
    mutationFn: (email: string) =>
      api.post('/api/Auth/request-otp', { email, action: 'REGISTER' }),
    onSuccess: () => {
      setStep('otp')
      message.success('ส่ง OTP ไปที่อีเมลของคุณแล้ว')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'ไม่สามารถส่ง OTP ได้ กรุณาลองใหม่'
      message.error(msg)
    },
  })

  // Step 2: verify OTP
  const { mutate: verifyOtp, isPending: verifyingOtp } = useMutation({
    mutationFn: (otp: string) =>
      api.post('/api/Auth/verify-otp', { email, otp }),
    onSuccess: () => setStep('password'),
    onError: () => message.error('OTP ไม่ถูกต้องหรือหมดอายุ'),
  })

  // Step 3: register
  const { mutate: register, isPending: registering } = useMutation({
    mutationFn: (password: string) =>
      api.post('/api/Auth/register', { email, password }),
    onSuccess: () => setStep('done'),
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่'
      message.error(msg)
    },
  })

  const stepIndex: Record<Step, number> = { email: 0, otp: 1, password: 2, done: 3 }

  const steps = [
    { label: 'อีเมล', icon: <MailOutlined /> },
    { label: 'OTP', icon: <SafetyOutlined /> },
    { label: 'รหัสผ่าน', icon: <LockOutlined /> },
  ]

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
            สมัครสมาชิก<br />
            เพื่อเริ่มต้นเส้นทาง<br />
            <span className={styles.leftTitleAccent}>อาชีพของคุณ</span>
          </div>
          <div className={styles.leftSub}>
            สร้างบัญชีและสมัครงานได้ในไม่กี่นาที<br />
            ติดตามสถานะใบสมัครได้ตลอดเวลา
          </div>

          {/* Custom step indicator */}
          <div className={styles.stepIndicator}>
            {steps.map((s, i) => (
              <div
                key={s.label}
                className={`${styles.stepItem} ${i < stepIndex[step] ? styles.stepDone : ''} ${i === stepIndex[step] ? styles.stepActive : ''}`}
              >
                <div className={styles.stepCircle}>{s.icon}</div>
                <span className={styles.stepLabel}>{s.label}</span>
                {i < steps.length - 1 && <div className={styles.stepLine} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className={styles.right}>
        <div className={styles.formWrap}>

          {/* Step 1: Email */}
          {step === 'email' && (
            <>
              <div className={styles.formTitle}>กรอกอีเมลของคุณ</div>
              <div className={styles.formSub}>เราจะส่งรหัส OTP ไปยังอีเมลนี้</div>
              <Form
                form={emailForm}
                layout="vertical"
                onFinish={(v) => { setEmail(v.email); requestOtp(v.email) }}
              >
                <Form.Item
                  name="email"
                  label="อีเมล"
                  rules={[
                    { required: true, message: 'กรุณากรอกอีเมล' },
                    { type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' },
                  ]}
                >
                  <Input size="large" placeholder="email@example.com" autoComplete="email" prefix={<MailOutlined />} />
                </Form.Item>
                <Form.Item className={styles.submitItem}>
                  <Button type="primary" htmlType="submit" size="large" block loading={requestingOtp}>
                    ส่งรหัส OTP
                  </Button>
                </Form.Item>
              </Form>
            </>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <>
              <div className={styles.formTitle}>ยืนยันรหัส OTP</div>
              <div className={styles.formSub}>
                ส่ง OTP ไปที่ <strong>{email}</strong> แล้ว<br />
                กรุณาตรวจสอบกล่องจดหมาย (รวมถึง Spam)
              </div>
              <Form
                form={otpForm}
                layout="vertical"
                onFinish={(v) => verifyOtp(v.otp)}
              >
                <Form.Item
                  name="otp"
                  label="รหัส OTP (6 หลัก)"
                  rules={[
                    { required: true, message: 'กรุณากรอกรหัส OTP' },
                    { len: 6, message: 'OTP ต้องมี 6 หลัก' },
                  ]}
                >
                  <Input
                    size="large"
                    maxLength={6}
                    placeholder="_ _ _ _ _ _"
                    className={styles.otpInput}
                    prefix={<SafetyOutlined />}
                  />
                </Form.Item>
                <Form.Item className={styles.submitItem}>
                  <Button type="primary" htmlType="submit" size="large" block loading={verifyingOtp}>
                    ยืนยัน OTP
                  </Button>
                </Form.Item>
              </Form>
              <button
                type="button"
                className={styles.resendBtn}
                onClick={() => { requestOtp(email) }}
                disabled={requestingOtp}
              >
                ขอรหัส OTP ใหม่
              </button>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => { setStep('email'); otpForm.resetFields() }}
              >
                ← แก้ไขอีเมล
              </button>
            </>
          )}

          {/* Step 3: Password */}
          {step === 'password' && (
            <>
              <div className={styles.formTitle}>ตั้งรหัสผ่าน</div>
              <div className={styles.formSub}>กำหนดรหัสผ่านสำหรับบัญชีของคุณ</div>
              <Form
                form={pwForm}
                layout="vertical"
                onFinish={(v) => register(v.password)}
              >
                <Form.Item
                  name="password"
                  label="รหัสผ่าน"
                  rules={[
                    { required: true, message: 'กรุณากรอกรหัสผ่าน' },
                    { min: 8, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' },
                  ]}
                >
                  <Input.Password size="large" placeholder="อย่างน้อย 8 ตัวอักษร" autoComplete="new-password" prefix={<LockOutlined />} />
                </Form.Item>
                <Form.Item
                  name="confirm"
                  label="ยืนยันรหัสผ่าน"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'กรุณายืนยันรหัสผ่าน' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) return Promise.resolve()
                        return Promise.reject('รหัสผ่านไม่ตรงกัน')
                      },
                    }),
                  ]}
                >
                  <Input.Password size="large" placeholder="กรอกรหัสผ่านอีกครั้ง" autoComplete="new-password" prefix={<LockOutlined />} />
                </Form.Item>
                <Form.Item className={styles.submitItem}>
                  <Button type="primary" htmlType="submit" size="large" block loading={registering}>
                    สมัครสมาชิก
                  </Button>
                </Form.Item>
              </Form>
            </>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className={styles.done}>
              <CheckCircleOutlined className={styles.doneIcon} />
              <div className={styles.doneTitle}>สมัครสมาชิกสำเร็จ!</div>
              <div className={styles.doneSub}>
                บัญชีของคุณพร้อมใช้งานแล้ว<br />
                เข้าสู่ระบบเพื่อเริ่มสมัครงานได้เลย
              </div>
              <Button
                type="primary"
                size="large"
                block
                onClick={() => navigate('/app/login')}
                className={styles.doneBtn}
              >
                เข้าสู่ระบบ
              </Button>
            </div>
          )}

          {step !== 'done' && (
            <div className={styles.loginLink}>
              มีบัญชีอยู่แล้ว?{' '}
              <button
                type="button"
                className={styles.loginBtn}
                onClick={() => navigate('/app/login')}
              >
                เข้าสู่ระบบ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
