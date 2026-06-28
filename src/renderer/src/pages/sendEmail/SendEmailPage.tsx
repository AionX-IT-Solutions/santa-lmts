import { useState } from 'react'
import { Mail, Send } from 'lucide-react'
import { notify } from '../../lib/notify'
import { Layout, PageContainer } from '../../components/layout/Layout'
import { PageHeader } from '../../components/ui/PageHeader'
import { FormField, Input, TextArea } from '../../components/ui/FormField'
import { FileUploadField } from '../../components/ui/FileUploadField'
import { Spinner } from '../../components/ui/Spinner'

export function SendEmailPage() {
  const [sending, setSending] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({ to: '', subject: '', body: '' })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!form.to.trim() || !form.subject.trim()) {
      notify.error('Recipient and Subject are required')
      return
    }
    setSending(true)
    try {
      // Open default mail client with mailto:
      const mailtoUrl = `mailto:${encodeURIComponent(form.to)}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(form.body)}`
      window.open(mailtoUrl)
      notify.success('Email client opened')
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to open email client')
    } finally {
      setSending(false)
    }
  }

  return (
    <Layout>
      <PageContainer>
        <PageHeader
          title="Send File to Email"
          subtitle="Compose and send files via email"
          icon={<Mail size={20} />}
        />
        <div className="max-w-2xl">
          <div className="card p-6">
            <form onSubmit={handleSend} className="flex flex-col gap-4">
              <FormField label="To" required>
                <Input
                  value={form.to}
                  onChange={set('to')}
                  type="email"
                  placeholder="recipient@example.com"
                />
              </FormField>
              <FormField label="Subject" required>
                <Input value={form.subject} onChange={set('subject')} placeholder="Email subject" />
              </FormField>
              <FormField label="Message">
                <TextArea
                  value={form.body}
                  onChange={set('body')}
                  rows={6}
                  placeholder="Type your message here..."
                />
              </FormField>
              <FileUploadField value={file} onChange={setFile} label="Attach File (optional)" />
              <div className="flex justify-end mt-2">
                <button type="submit" className="btn-primary" disabled={sending}>
                  {sending ? (
                    <>
                      <Spinner size="sm" className="text-white" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </PageContainer>
    </Layout>
  )
}
