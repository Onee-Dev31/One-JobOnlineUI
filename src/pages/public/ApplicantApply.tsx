import { useState, useMemo, useEffect } from 'react'
import {
  Form, Input, Select, Button, Upload, Checkbox, Spin, Steps, App, DatePicker,
} from 'antd'
import {
  ArrowLeftOutlined, InboxOutlined, CheckCircleOutlined, FileTextOutlined,
} from '@ant-design/icons'
import { useQuery, useQueries, useMutation } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import type { UploadFile } from 'antd'
import dayjs from 'dayjs'
import api from '../../services/api'
import publicApi from '../../services/publicApi'
import styles from './ApplicantApply.module.css'

interface Province { ProvinceID: number; ProvinceNameThai: string; ProvinceCode: number }
interface District { DistrictID: number; DistrictNameThai: string; DistrictCode: number }
interface SubDistrict { SubDistrictID: number; SubDistrictNameThai: string; SubDistrictCode: number; PostalCode: string }
interface Prefix { PrefixId: number; PrefixName: string }
interface EducationLevel { EducationLevelID: number; EducationLevelName: string }
interface YearRange { YearValue: number; DisplayName: string }
interface Job { jobID: number; jobTitle: string; departmentName: string; location: string }

function decodeApplicantId(): number | null {
  const token = localStorage.getItem('applicantToken')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    const id = payload.sub ?? payload.ApplicantID ?? payload.nameid ?? payload.id
    return id ? Number(id) : null
  } catch {
    return null
  }
}

const STEP_FIELDS = [
  ['prefixId', 'firstNameThai', 'lastNameThai', 'firstNameENG', 'lastNameENG', 'nationalID', 'birthDate', 'mobilePhone'],
  ['address', 'province', 'district', 'subDistrict'],
  ['educationLevelId', 'expectedSalary'],
  [],
]

export default function ApplicantApply() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const [step, setStep] = useState(0)
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null)
  const [resumeFileList, setResumeFileList] = useState<UploadFile[]>([])
  const [extraFileList, setExtraFileList] = useState<UploadFile[]>([])
  const [done, setDone] = useState(false)

  const applicantId = useMemo(decodeApplicantId, [])

  // Redirect if not logged in
  useEffect(() => {
    if (!localStorage.getItem('applicantToken')) {
      navigate('/app/login', { state: { from: `/app/apply/${jobId}` }, replace: true })
    }
  }, [navigate, jobId])

  // Load job info (no auth needed)
  const { data: job, isPending: jobLoading } = useQuery<Job>({
    queryKey: ['/api/Jobs', jobId],
    queryFn: () => api.get(`/api/Jobs/${jobId}`).then((r) => r.data),
  })

  // All dropdown data in parallel
  const [prefixQ, eduQ, yearQ, provincesQ] = useQueries({
    queries: [
      { queryKey: ['/api/Prefix/GetActivePrefixes'], queryFn: () => publicApi.get('/api/Prefix/GetActivePrefixes').then((r) => r.data as Prefix[]) },
      { queryKey: ['/api/EducationLevels/GetAll'], queryFn: () => publicApi.get('/api/EducationLevels/GetAll').then((r) => r.data as EducationLevel[]) },
      { queryKey: ['/api/YearRange/GetYearRange'], queryFn: () => publicApi.get('/api/YearRange/GetYearRange').then((r) => r.data as YearRange[]) },
      { queryKey: ['/api/Location/provinces'], queryFn: () => publicApi.get('/api/Location/provinces').then((r) => r.data as Province[]) },
    ],
  })

  // Cascading location
  const { data: districts = [] } = useQuery<District[]>({
    queryKey: ['/api/Location/districts', selectedProvince?.ProvinceCode],
    queryFn: () => publicApi.get(`/api/Location/districts/${selectedProvince!.ProvinceCode}`).then((r) => r.data),
    enabled: !!selectedProvince,
  })

  const { data: subDistricts = [] } = useQuery<SubDistrict[]>({
    queryKey: ['/api/Location/subdistricts', selectedDistrict?.DistrictID],
    queryFn: () => publicApi.get(`/api/Location/subdistricts/${selectedDistrict!.DistrictID}`).then((r) => r.data),
    enabled: !!selectedDistrict,
  })

  // PDPA content
  const { data: pdpa } = useQuery<{ Content: string }>({
    queryKey: ['/api/ApplicantNew/GetPDPAContent'],
    queryFn: () => publicApi.get('/api/ApplicantNew/GetPDPAContent').then((r) => r.data),
    enabled: step === 3,
  })

  // Submit
  const { mutate: submitForm, isPending: submitting } = useMutation({
    mutationFn: (formData: FormData) =>
      publicApi.post('/api/ApplicantNew/submit-application-with-filesV2', formData),
    onSuccess: () => setDone(true),
    onError: () => message.error('ส่งใบสมัครไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'),
  })

  const handleNext = async () => {
    try {
      await form.validateFields(STEP_FIELDS[step])
      if (step === 3) {
        if (resumeFileList.length === 0) {
          message.error('กรุณาอัพโหลด Resume ก่อน')
          return
        }
        handleSubmit()
      } else {
        setStep((s) => s + 1)
      }
    } catch {
      // validation error - antd shows field errors
    }
  }

  const handleSubmit = () => {
    const values = form.getFieldsValue(true)
    const jsonPayload = {
      ApplicantID: applicantId,
      JobID: Number(jobId),
      PrefixId: values.prefixId,
      FirstNameThai: values.firstNameThai,
      LastNameThai: values.lastNameThai,
      FirstNameENG: values.firstNameENG,
      LastNameENG: values.lastNameENG,
      NationalID: values.nationalID,
      BirthDate: values.birthDate ? dayjs(values.birthDate).format('YYYY-MM-DD') : null,
      MobilePhone: values.mobilePhone,
      Address: values.address,
      ProvinceCode: selectedProvince?.ProvinceCode,
      DistrictCode: selectedDistrict?.DistrictCode,
      SubDistrictCode: values.subDistrict,
      PostalCode: values.postalCode,
      EducationLevelID: values.educationLevelId,
      Institution: values.institution,
      Major: values.major,
      GraduateYear: values.graduateYear,
      WorkExperienceYear: values.workExpYears,
      LastJobTitle: values.lastJobTitle,
      LastCompany: values.lastCompany,
      LastSalary: values.lastSalary,
      ExpectedSalary: values.expectedSalary,
      PDPAAccepted: true,
    }
    const fd = new FormData()
    fd.append('jsonData', JSON.stringify(jsonPayload))
    resumeFileList.forEach((f) => { if (f.originFileObj) fd.append('files', f.originFileObj) })
    extraFileList.forEach((f) => { if (f.originFileObj) fd.append('files', f.originFileObj) })
    submitForm(fd)
  }

  const onProvinceChange = (code: number, opt: any) => {
    setSelectedProvince(opt.data)
    setSelectedDistrict(null)
    form.setFieldsValue({ district: undefined, subDistrict: undefined, postalCode: '' })
  }

  const onDistrictChange = (id: number, opt: any) => {
    setSelectedDistrict(opt.data)
    form.setFieldsValue({ subDistrict: undefined, postalCode: '' })
  }

  const onSubDistrictChange = (code: number, opt: any) => {
    form.setFieldValue('postalCode', opt.data?.PostalCode ?? '')
  }

  if (jobLoading) return <div className={styles.center}><Spin size="large" /></div>

  if (done) {
    return (
      <div className={styles.done}>
        <CheckCircleOutlined className={styles.doneIcon} />
        <div className={styles.doneTitle}>ส่งใบสมัครสำเร็จ!</div>
        <div className={styles.doneSub}>
          เราได้รับใบสมัครของคุณแล้ว<br />
          ทีม HR จะติดต่อกลับภายใน 7 วันทำการ
        </div>
        <Button type="primary" size="large" onClick={() => navigate('/app/jobs')}>
          กลับหน้ารายการงาน
        </Button>
      </div>
    )
  }

  const prefixOptions = (prefixQ.data ?? []).map((p) => ({ value: p.PrefixId, label: p.PrefixName }))
  const eduOptions = (eduQ.data ?? []).map((e) => ({ value: e.EducationLevelID, label: e.EducationLevelName }))
  const yearOptions = (yearQ.data ?? []).map((y) => ({ value: y.YearValue, label: y.DisplayName }))
  const provinceOptions = (provincesQ.data ?? []).map((p) => ({ value: p.ProvinceCode, label: p.ProvinceNameThai, data: p }))
  const districtOptions = districts.map((d) => ({ value: d.DistrictID, label: d.DistrictNameThai, data: d }))
  const subDistrictOptions = subDistricts.map((s) => ({ value: s.SubDistrictCode, label: s.SubDistrictNameThai, data: s }))

  const steps = ['ข้อมูลส่วนตัว', 'ที่อยู่', 'การศึกษา', 'เอกสาร']

  return (
    <div className={styles.page}>
      <button type="button" className={styles.backLink} onClick={() => navigate(`/app/jobs/${jobId}`)}>
        <ArrowLeftOutlined /> กลับหน้ารายละเอียดงาน
      </button>

      {/* Job header */}
      {job && (
        <div className={styles.jobBanner}>
          <div className={styles.bannerIcon}>
            <FileTextOutlined />
          </div>
          <div>
            <div className={styles.bannerTitle}>สมัครงาน — {job.jobTitle}</div>
            <div className={styles.bannerMeta}>{job.departmentName} · {job.location}</div>
          </div>
        </div>
      )}

      {/* Step indicator */}
      <Steps
        current={step}
        size="small"
        className={styles.steps}
        items={steps.map((s) => ({ title: s }))}
      />

      {/* Form card */}
      <div className={styles.formCard}>
        <Form form={form} layout="vertical" requiredMark={false}>

          {/* ─── Step 0: Personal ───────────── */}
          {step === 0 && (
            <div>
              <div className={styles.sectionTitle}>ข้อมูลส่วนตัว</div>
              <div className={styles.row}>
                <Form.Item name="prefixId" label="คำนำหน้า" rules={[{ required: true, message: 'กรุณาเลือกคำนำหน้า' }]} className={styles.colSmall}>
                  <Select placeholder="เลือก" options={prefixOptions} size="large" />
                </Form.Item>
                <Form.Item name="firstNameThai" label="ชื่อ (ไทย)" rules={[{ required: true, message: 'กรุณากรอกชื่อ' }]} className={styles.col}>
                  <Input size="large" placeholder="ชื่อภาษาไทย" />
                </Form.Item>
                <Form.Item name="lastNameThai" label="นามสกุล (ไทย)" rules={[{ required: true, message: 'กรุณากรอกนามสกุล' }]} className={styles.col}>
                  <Input size="large" placeholder="นามสกุลภาษาไทย" />
                </Form.Item>
              </div>
              <div className={styles.row2}>
                <Form.Item name="firstNameENG" label="First Name (EN)" rules={[{ required: true, message: 'กรุณากรอกชื่อภาษาอังกฤษ' }]} className={styles.col}>
                  <Input size="large" placeholder="First Name" />
                </Form.Item>
                <Form.Item name="lastNameENG" label="Last Name (EN)" rules={[{ required: true, message: 'กรุณากรอกนามสกุลภาษาอังกฤษ' }]} className={styles.col}>
                  <Input size="large" placeholder="Last Name" />
                </Form.Item>
              </div>
              <div className={styles.row2}>
                <Form.Item
                  name="nationalID"
                  label="เลขบัตรประชาชน"
                  rules={[
                    { required: true, message: 'กรุณากรอกเลขบัตรประชาชน' },
                    { len: 13, message: 'ต้องมี 13 หลัก' },
                    { pattern: /^\d+$/, message: 'ตัวเลขเท่านั้น' },
                  ]}
                  className={styles.col}
                >
                  <Input size="large" placeholder="1234567890123" maxLength={13} />
                </Form.Item>
                <Form.Item name="birthDate" label="วันเกิด" rules={[{ required: true, message: 'กรุณาเลือกวันเกิด' }]} className={styles.col}>
                  <DatePicker size="large" format="DD/MM/YYYY" className={styles.fullWidth} placeholder="วว/ดด/ปปปป" />
                </Form.Item>
              </div>
              <div className={styles.row2}>
                <Form.Item name="mobilePhone" label="เบอร์โทรศัพท์" rules={[{ required: true, message: 'กรุณากรอกเบอร์โทร' }, { pattern: /^0\d{8,9}$/, message: 'รูปแบบไม่ถูกต้อง' }]} className={styles.col}>
                  <Input size="large" placeholder="0812345678" maxLength={10} />
                </Form.Item>
              </div>
            </div>
          )}

          {/* ─── Step 1: Address ─────────────── */}
          {step === 1 && (
            <div>
              <div className={styles.sectionTitle}>ที่อยู่ปัจจุบัน</div>
              <Form.Item name="address" label="ที่อยู่ (บ้านเลขที่ ถนน หมู่บ้าน)" rules={[{ required: true, message: 'กรุณากรอกที่อยู่' }]}>
                <Input.TextArea size="large" rows={2} placeholder="123 ถนน..." />
              </Form.Item>
              <div className={styles.row2}>
                <Form.Item name="province" label="จังหวัด" rules={[{ required: true, message: 'กรุณาเลือกจังหวัด' }]} className={styles.col}>
                  <Select
                    size="large"
                    placeholder="เลือกจังหวัด"
                    showSearch
                    optionFilterProp="label"
                    options={provinceOptions}
                    onChange={onProvinceChange}
                  />
                </Form.Item>
                <Form.Item name="district" label="อำเภอ/เขต" rules={[{ required: true, message: 'กรุณาเลือกอำเภอ' }]} className={styles.col}>
                  <Select
                    size="large"
                    placeholder="เลือกอำเภอ"
                    showSearch
                    optionFilterProp="label"
                    options={districtOptions}
                    disabled={!selectedProvince}
                    onChange={onDistrictChange}
                  />
                </Form.Item>
              </div>
              <div className={styles.row2}>
                <Form.Item name="subDistrict" label="ตำบล/แขวง" className={styles.col}>
                  <Select
                    size="large"
                    placeholder="เลือกตำบล"
                    showSearch
                    optionFilterProp="label"
                    options={subDistrictOptions}
                    disabled={!selectedDistrict}
                    onChange={onSubDistrictChange}
                  />
                </Form.Item>
                <Form.Item name="postalCode" label="รหัสไปรษณีย์" className={styles.col}>
                  <Input size="large" placeholder="กรอกอัตโนมัติ" readOnly />
                </Form.Item>
              </div>
            </div>
          )}

          {/* ─── Step 2: Education & Experience ── */}
          {step === 2 && (
            <div>
              <div className={styles.sectionTitle}>การศึกษา</div>
              <div className={styles.row2}>
                <Form.Item name="educationLevelId" label="ระดับการศึกษาสูงสุด" rules={[{ required: true, message: 'กรุณาเลือกระดับการศึกษา' }]} className={styles.col}>
                  <Select size="large" placeholder="เลือกระดับการศึกษา" options={eduOptions} />
                </Form.Item>
                <Form.Item name="graduateYear" label="ปีที่จบการศึกษา (พ.ศ.)" className={styles.col}>
                  <Select size="large" placeholder="เลือกปี" options={yearOptions} showSearch />
                </Form.Item>
              </div>
              <div className={styles.row2}>
                <Form.Item name="institution" label="สถาบันการศึกษา" className={styles.col}>
                  <Input size="large" placeholder="มหาวิทยาลัย..." />
                </Form.Item>
                <Form.Item name="major" label="คณะ/สาขา" className={styles.col}>
                  <Input size="large" placeholder="วิศวกรรมศาสตร์..." />
                </Form.Item>
              </div>

              <div className={styles.sectionTitle} style={{ marginTop: 24 }}>ประสบการณ์ทำงาน</div>
              <div className={styles.row2}>
                <Form.Item name="workExpYears" label="ประสบการณ์รวม (ปี)" className={styles.col}>
                  <Input size="large" type="number" min={0} placeholder="0" />
                </Form.Item>
                <Form.Item name="lastJobTitle" label="ตำแหน่งงานล่าสุด" className={styles.col}>
                  <Input size="large" placeholder="Software Developer" />
                </Form.Item>
              </div>
              <div className={styles.row2}>
                <Form.Item name="lastCompany" label="บริษัทล่าสุด" className={styles.col}>
                  <Input size="large" placeholder="บริษัท..." />
                </Form.Item>
                <Form.Item name="lastSalary" label="เงินเดือนล่าสุด (บาท)" className={styles.col}>
                  <Input size="large" type="number" min={0} placeholder="25000" />
                </Form.Item>
              </div>
              <div className={styles.row2}>
                <Form.Item
                  name="expectedSalary"
                  label="เงินเดือนที่คาดหวัง (บาท)"
                  rules={[{ required: true, message: 'กรุณากรอกเงินเดือนที่คาดหวัง' }]}
                  className={styles.col}
                >
                  <Input size="large" type="number" min={0} placeholder="30000" />
                </Form.Item>
              </div>
            </div>
          )}

          {/* ─── Step 3: Files + PDPA ─────────── */}
          {step === 3 && (
            <div>
              <div className={styles.sectionTitle}>อัพโหลดเอกสาร</div>

              <Form.Item label="Resume / CV (PDF, DOC, DOCX) *" required>
                <Upload.Dragger
                  fileList={resumeFileList}
                  beforeUpload={() => false}
                  onChange={({ fileList }) => setResumeFileList(fileList.slice(-1))}
                  accept=".pdf,.doc,.docx"
                  maxCount={1}
                >
                  <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                  <p className="ant-upload-text">คลิกหรือลากไฟล์มาวางที่นี่</p>
                  <p className="ant-upload-hint">รองรับ PDF, DOC, DOCX (ไม่เกิน 10MB)</p>
                </Upload.Dragger>
              </Form.Item>

              <Form.Item label="เอกสารเพิ่มเติม (ถ้ามี)" className={styles.extraUpload}>
                <Upload.Dragger
                  fileList={extraFileList}
                  beforeUpload={() => false}
                  onChange={({ fileList }) => setExtraFileList(fileList)}
                  multiple
                  maxCount={5}
                >
                  <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                  <p className="ant-upload-text">คลิกหรือลากไฟล์มาวางที่นี่</p>
                  <p className="ant-upload-hint">เช่น Transcript, Portfolio, Certificate (สูงสุด 5 ไฟล์)</p>
                </Upload.Dragger>
              </Form.Item>

              {/* PDPA */}
              {pdpa && (
                <div className={styles.pdpaWrap}>
                  <div className={styles.pdpaTitle}>นโยบายการคุ้มครองข้อมูลส่วนบุคคล (PDPA)</div>
                  <div
                    className={styles.pdpaContent}
                    dangerouslySetInnerHTML={{ __html: pdpa.Content }}
                  />
                </div>
              )}

              <Form.Item
                name="pdpaAccepted"
                valuePropName="checked"
                rules={[{
                  validator: (_, value) =>
                    value ? Promise.resolve() : Promise.reject('กรุณายอมรับนโยบาย PDPA ก่อนส่งใบสมัคร'),
                }]}
                className={styles.pdpaCheckbox}
              >
                <Checkbox>
                  ฉันได้อ่านและยอมรับ <strong>นโยบายการคุ้มครองข้อมูลส่วนบุคคล (PDPA)</strong> ของ The One Enterprise
                </Checkbox>
              </Form.Item>
            </div>
          )}

        </Form>

        {/* Navigation */}
        <div className={styles.navBtns}>
          {step > 0 && (
            <Button size="large" onClick={() => setStep((s) => s - 1)}>
              ← ย้อนกลับ
            </Button>
          )}
          <Button
            type="primary"
            size="large"
            onClick={handleNext}
            loading={submitting}
            className={styles.nextBtn}
          >
            {step === 3 ? 'ส่งใบสมัคร' : 'ถัดไป →'}
          </Button>
        </div>
      </div>
    </div>
  )
}
