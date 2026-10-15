import { deleteJson, getJson, patchJson, postJson } from './http'
import type { ConfigInput, ConfigUpdate, SavedConfig } from '@/types/config'

export const fetchConfigs = () => getJson<SavedConfig[]>('/configs')
export const createConfig = (body: ConfigInput) => postJson<SavedConfig>('/configs', body)
export const updateConfig = (id: number, body: ConfigUpdate) => patchJson<SavedConfig>(`/configs/${id}`, body)
export const duplicateConfig = (id: number) => postJson<SavedConfig>(`/configs/${id}/duplicate`)
export const deleteConfig = (id: number) => deleteJson(`/configs/${id}`)
