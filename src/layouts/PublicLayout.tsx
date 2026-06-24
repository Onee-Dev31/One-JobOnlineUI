import { Button } from 'antd'
import { Outlet, useNavigate } from 'react-router-dom'
import styles from './PublicLayout.module.css'

export default function PublicLayout() {
  const navigate = useNavigate()

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.logoGroup} onClick={() => navigate('/app/jobs')}>
          <div className={styles.logoMark}>T1</div>
          <div className={styles.logoText}>
            <span className={styles.logoName}>The One Enterprise</span>
            <span className={styles.logoSub}>Career Portal</span>
          </div>
        </div>

        <div className={styles.navRight}>
          <span className={styles.navLink} onClick={() => navigate('/app/jobs')}>
            ตำแหน่งงานทั้งหมด
          </span>
          <Button
            type="primary"
            size="small"
            onClick={() => navigate('/app/login')}
          >
            เข้าสู่ระบบ / สมัครสมาชิก
          </Button>
        </div>
      </header>

      <main className={styles.content}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <div className={styles.footerLogoMark}>T1</div>
          <span className={styles.footerName}>The One Enterprise</span>
        </div>
        <span className={styles.footerRight}>© 2025 The One Enterprise Co., Ltd. All rights reserved.</span>
      </footer>
    </div>
  )
}
