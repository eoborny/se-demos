import { useCallback, useEffect, useState } from 'react'
import {
  useAddCenterNote,
  useGetCenterDetail,
  useGetTestCenters,
} from './backend/testCenters'
import type { CenterDetail, CenterNote, TestCenter } from '../data/types'

export function useCenters() {
  const fn = useGetTestCenters()
  const { trigger } = fn

  useEffect(() => {
    trigger()
  }, [trigger])

  return {
    centers: (fn.data as TestCenter[] | undefined) ?? [],
    loading: fn.loading,
    error: fn.error,
    reload: () => trigger({}, { skipCache: true }),
  }
}

export function useCenterDetail() {
  const detailFn = useGetCenterDetail()
  const noteFn = useAddCenterNote()
  const [detail, setDetail] = useState<CenterDetail | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const { trigger: triggerDetail } = detailFn
  const { trigger: triggerNote } = noteFn

  const load = useCallback(
    async (centerId: string) => {
      setActiveId(centerId)
      setDetail(null)
      const result = (await triggerDetail(
        { centerId },
        { skipCache: true },
      ).result) as CenterDetail
      setDetail(result)
    },
    [triggerDetail],
  )

  const addNote = useCallback(
    async (input: Pick<CenterNote, 'centerId' | 'kind' | 'text'>) => {
      await triggerNote(input).result
      if (activeId) {
        const result = (await triggerDetail(
          { centerId: activeId },
          { skipCache: true },
        ).result) as CenterDetail
        setDetail(result)
      }
    },
    [triggerNote, triggerDetail, activeId],
  )

  return {
    detail,
    loading: detailFn.loading,
    saving: noteFn.loading,
    load,
    addNote,
  }
}
