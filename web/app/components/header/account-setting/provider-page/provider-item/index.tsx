import { useState } from 'react'
import cn from 'classnames'
import s from './index.module.css'
import { useContext } from 'use-context-selector'
import Indicator from '../../../indicator'
import { useTranslation } from 'react-i18next'
import type { Provider, ProviderAzureToken } from '@/models/common'
import OpenaiProvider from '../openai-provider/provider'
import AzureProvider from '../azure-provider'
import { ValidatedStatus } from '../provider-input/useValidateToken'
import { updateProviderAIKey } from '@/service/common'
import { ToastContext } from '@/app/components/base/toast'

interface IProviderItemProps {
  icon: string
  name: string
  provider: Provider
  activeId: string
  onActive: (v: string) => void
  onSave: () => void
}
const ProviderItem = ({
  activeId,
  icon,
  name,
  provider,
  onActive,
  onSave
}: IProviderItemProps) => {
  const { t } = useTranslation()
  const [validatedStatus, setValidatedStatus] = useState<ValidatedStatus>()
  const [loading, setLoading] = useState(false)
  const { notify } = useContext(ToastContext)
  const [token, setToken] = useState<ProviderAzureToken | string>(
    provider.provider_name === 'azure_openai' 
      ? { azure_api_base: '', azure_api_type: '', azure_api_version: '', azure_api_key: '' } 
      : ''
    )
  const id = `${provider.provider_name}-${provider.provider_type}`
  const isOpen = id === activeId
  const providerKey = provider.provider_name === 'azure_openai' ? (provider.token as ProviderAzureToken)?.azure_api_key  : provider.token
  const comingSoon = false
  const isValid = provider.is_valid

  const handleUpdateToken = async () => {
    if (loading) return
    if (validatedStatus === ValidatedStatus.Success || !token) {
      try {
        setLoading(true)
        await updateProviderAIKey({ url: `/workspaces/current/providers/${provider.provider_name}/token`, body: { token } })
        notify({ type: 'success', message: t('common.actionMsg.modifiedSuccessfully') })
        onActive('')
      } catch (e) {
        notify({ type: 'error', message: t('common.provider.saveFailed') })
      } finally {
        setLoading(false)
        onSave()
      }
    }
  }

  return (
    <div className='mb-2 border-[0.5px] border-gray-200 bg-gray-50 rounded-md'>
      <div className='flex items-center px-4 h-[52px] cursor-pointer border-b-[0.5px] border-b-gray-200'>
        <div className={cn(s[`icon-${icon}`], 'mr-3 w-6 h-6 rounded-md')} />
        <div className='grow text-sm font-medium text-gray-800'>{name}</div>
        {
          providerKey && !comingSoon && !isOpen && (
            <div className='flex items-center mr-4'>
              {!isValid && <div className='text-xs text-[#D92D20]'>{t('common.provider.invalidApiKey')}</div>}
              <Indicator color={!isValid ? 'red' : 'green'} className='ml-2' />
            </div>
          )
        }
        {
          !comingSoon && !isOpen && (
            <div className='
              px-3 h-[28px] bg-white border border-gray-200 rounded-md cursor-pointer
              text-xs font-medium text-gray-700 flex items-center
            ' onClick={() => onActive(id)}>
              {providerKey ? t('common.provider.editKey') : t('common.provider.addKey')}
            </div>
          )
        }
        {
          comingSoon && !isOpen && (
            <div className='
              flex items-center px-2 h-[22px] border border-[#444CE7] rounded-md
              text-xs font-medium text-[#444CE7]
            '>
              {t('common.provider.comingSoon')}
            </div>
          )
        }
        {
          isOpen && (
            <div className='flex items-center'>
              <div className='
                flex items-center
                mr-[5px] px-3 h-7 rounded-md cursor-pointer
                text-xs font-medium text-gray-700
              ' onClick={() => onActive('')} >
                {t('common.operation.cancel')}
              </div>
              <div className='
                flex items-center
                px-3 h-7 rounded-md cursor-pointer bg-primary-700
                text-xs font-medium text-white
              ' onClick={handleUpdateToken}>
                {t('common.operation.save')}
              </div>
            </div>
          )
        }
      </div>
      {
        provider.provider_name === 'openai' && isOpen && (
          <OpenaiProvider 
            provider={provider} 
            onValidatedStatus={v => setValidatedStatus(v)} 
            onTokenChange={v => setToken(v)}
          />
        )
      }
      {
        provider.provider_name === 'azure_openai' && isOpen && (
          <AzureProvider 
            provider={provider} 
            onValidatedStatus={v => setValidatedStatus(v)} 
            onTokenChange={v => setToken(v)}
          />
        )
      }
    </div>
  )
}

export default ProviderItem