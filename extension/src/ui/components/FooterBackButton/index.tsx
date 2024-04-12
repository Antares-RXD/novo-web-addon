import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Footer } from 'antd/lib/layout/layout'
import { MouseEventHandler } from 'react'
import { useTranslation } from 'react-i18next'
import './index.less'
export const FooterBackButton: React.FC<{ onClick?: MouseEventHandler<HTMLElement> }> = ({ onClick }) => {
  const { t } = useTranslation()
  return (
    <Footer className="footer-bar">
      <div
        className="footer-back-button"
        onClick={(e) => {
          if (onClick) {
            onClick(e)
          } else {
            window.history.go(-1)
          }
        }}>
        <FontAwesomeIcon icon={faArrowLeft} style={{ height: '1.1rem' }} />
        <span className="font-semibold leading-4_5">&nbsp;{t('Back')}</span>
      </div>
    </Footer>
  )
}
