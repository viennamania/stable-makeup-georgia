'use client'

import { useState, useCallback, useMemo, type ChangeEvent, useEffect } from 'react'
import toast from 'react-hot-toast'
import { PutBlobResult } from '@vercel/blob'
import type { Account } from 'thirdweb/wallets'

import LoadingDots from './loading-dots'
import { getDictionary } from "../app/dictionaries";
import {
  postAdminSignedJson,
  signAdminActionPayload,
} from "@/lib/client/admin-signed-action";
import {
  CLIENT_SETTINGS_ADMIN_MUTATION_SIGNING_PREFIX,
  CLIENT_SETTINGS_ADMIN_UPLOAD_ROUTE,
  CLIENT_SETTINGS_ADMIN_UPLOAD_SIGNING_PREFIX,
  CLIENT_SETTINGS_UPDATE_AVATAR_ROUTE,
} from "@/lib/security/client-settings-admin";

const MAX_FILE_SIZE_MB = 10

export default function Uploader(
  {
    lang,
    account,
    walletAddress,
  }: {
    lang: string,
    account: Account | undefined,
    walletAddress?: string,
  }
) {
  const [dictionaryData, setDictionaryData] = useState({
    File_uploaded: "",
    Upload_a_file: "",
    Accepted_formats: "",
    Drag_and_drop_or_click_to_upload: "",
    Max_file_size: "",
    Photo_upload: "",
    Confirm_upload: "",
  });

  useEffect(() => {
    async function fetchData() {
      const dictionary = await getDictionary(lang);
      setDictionaryData(dictionary);
    }
    fetchData();
  }, [lang]);

  const {
    File_uploaded,
    Upload_a_file,
    Accepted_formats,
    Drag_and_drop_or_click_to_upload,
    Max_file_size,
    Photo_upload,
    Confirm_upload,
  } = dictionaryData

  const [fileUpdated, setFileUpdated] = useState(false);
  const [data, setData] = useState<{
    image: string | null
  }>({
    image: null,
  })
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [saving, setSaving] = useState(false)

  const onChangePicture = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextFile = event.currentTarget.files && event.currentTarget.files[0]
      if (nextFile) {
        if (nextFile.size / 1024 / 1024 > MAX_FILE_SIZE_MB) {
          toast.error(`File size too big (max ${MAX_FILE_SIZE_MB}MB)`)
        } else {
          setFile(nextFile)
          const reader = new FileReader()
          reader.onload = (e) => {
            setData((prev) => ({ ...prev, image: e.target?.result as string }))
          }
          reader.readAsDataURL(nextFile)
          setFileUpdated(true);
        }
      }
    },
    [setData]
  )

  const saveDisabled = useMemo(() => {
    return !file || !data.image || saving
  }, [data.image, file, saving])

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/api/client/getClientInfo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (result.result?.clientInfo?.avatar) {
        setData((prev) => ({
          ...prev,
          image: result.result.clientInfo.avatar,
        }));
      }
    };

    fetchData();
  }, []);

  return (
    <form
      className="grid gap-6"
      onSubmit={async (e) => {
        e.preventDefault()

        if (!file) {
          toast.error('업로드할 로고 파일을 선택해주세요.')
          return
        }

        if (!account || !walletAddress) {
          toast.error('관리자 지갑 연결이 필요합니다.')
          return
        }

        setSaving(true)

        try {
          const contentType = file.type || 'application/octet-stream'
          const signed = await signAdminActionPayload({
            account,
            route: CLIENT_SETTINGS_ADMIN_UPLOAD_ROUTE,
            signingPrefix: CLIENT_SETTINGS_ADMIN_UPLOAD_SIGNING_PREFIX,
            requesterWalletAddress: walletAddress,
            actionFields: {
              contentType,
            },
          })

          const uploadResponse = await fetch(CLIENT_SETTINGS_ADMIN_UPLOAD_ROUTE, {
            method: 'POST',
            headers: {
              'content-type': contentType,
              'x-admin-requester-storecode': signed.requesterStorecode,
              'x-admin-requester-wallet-address': signed.requesterWalletAddress,
              'x-admin-signature': signed.signature,
              'x-admin-signed-at': signed.signedAt,
              'x-admin-nonce': signed.nonce,
            },
            body: file,
          })

          if (!uploadResponse.ok) {
            const errorPayload = await uploadResponse.json().catch(() => null)
            toast.error(errorPayload?.error || '로고 업로드에 실패했습니다.')
            return
          }

          const { url } = (await uploadResponse.json()) as PutBlobResult
          if (!url) {
            toast.error('업로드 결과가 올바르지 않습니다.')
            return
          }

          const updateResponse = await postAdminSignedJson({
            account,
            route: CLIENT_SETTINGS_UPDATE_AVATAR_ROUTE,
            signingPrefix: CLIENT_SETTINGS_ADMIN_MUTATION_SIGNING_PREFIX,
            requesterWalletAddress: walletAddress,
            body: {
              avatar: url,
            },
          })

          const updateResult = await updateResponse.json().catch(() => null)
          if (!updateResponse.ok || !updateResult?.result) {
            toast.error(updateResult?.error || '로고 저장에 실패했습니다.')
            return
          }

          setData((prev) => ({
            ...prev,
            image: url,
          }))

          toast(
            (t: { id: string }) => (
              <div className="relative">
                <div className="p-2">
                  <p className="mt-5 text-sm text-gray-900">
                    {File_uploaded}
                  </p>
                </div>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="absolute top-0 -right-2 inline-flex rounded-full p-1.5 text-gray-400 transition ease-in-out duration-150 hover:bg-gray-100 focus:outline-none focus:text-gray-500"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 5.293a1 1 0 011.414 0L10
                        8.586l3.293-3.293a1 1 0 111.414 1.414L11.414
                        10l3.293 3.293a1 1 0 01-1.414 1.414L10
                        11.414l-3.293 3.293a1 1 0 01-1.414-1.414L8.586
                        10 5.293 6.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ),
            { duration: 3000 }
          )

          setFile(null)
          setFileUpdated(false)
        } catch (error) {
          toast.error('로고 업로드에 실패했습니다.')
        } finally {
          setSaving(false)
        }
      }}
    >
      <div>
        <div className="mb-4 space-y-1">
          <h2 className="text-sm font-semibold">
            {Upload_a_file}
          </h2>
          <p className="text-sm">
            {Accepted_formats}
          </p>
          <p className="text-sm">
            .png, .jpg, .jpeg, .webp, .gif
          </p>
        </div>
        <label
          htmlFor="image-upload"
          className="group relative mt-2 flex h-36 cursor-pointer flex-col items-center justify-center rounded-md border border-gray-300 bg-white shadow-sm transition-all hover:bg-gray-50"
        >
          <div
            className="absolute z-[5] h-full w-full rounded-md"
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setDragActive(true)
            }}
            onDragEnter={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setDragActive(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setDragActive(false)
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setDragActive(false)

              const nextFile = e.dataTransfer.files && e.dataTransfer.files[0]
              if (nextFile) {
                if (nextFile.size / 1024 / 1024 > MAX_FILE_SIZE_MB) {
                  toast.error(`File size too big (max ${MAX_FILE_SIZE_MB}MB)`)
                } else {
                  setFile(nextFile)
                  const reader = new FileReader()
                  reader.onload = (event) => {
                    setData((prev) => ({
                      ...prev,
                      image: event.target?.result as string,
                    }))
                  }
                  reader.readAsDataURL(nextFile)
                  setFileUpdated(true)
                }
              }
            }}
          />
          <div
            className={`${
              dragActive ? 'border-2 border-black' : ''
            } absolute z-[3] flex h-full w-full flex-col items-center justify-center rounded-md px-2 transition-all ${
              data.image
                ? 'bg-white/80 opacity-0 hover:opacity-100 hover:backdrop-blur-md'
                : 'bg-white opacity-100 hover:bg-gray-50'
            }`}
          >
            <svg
              className={`${
                dragActive ? 'scale-110' : 'scale-100'
              } h-7 w-7 text-gray-500 transition-all duration-75 group-hover:scale-110 group-active:scale-95`}
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
              <path d="M12 12v9"></path>
              <path d="m16 16-4-4-4 4"></path>
            </svg>
            <p className="mt-2 text-center text-xs text-gray-500">
              {Drag_and_drop_or_click_to_upload}
            </p>
            <p className="mt-2 text-center text-xs text-gray-500">
              {Max_file_size}
            </p>
            <span className="sr-only">
              {Photo_upload}
            </span>
          </div>
          {data.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.image}
              alt="Preview"
              className="h-full w-full rounded-md object-cover"
            />
          )}
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            id="image-upload"
            name="image"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={onChangePicture}
          />
        </div>
      </div>

      {fileUpdated && (
        <button
          disabled={saveDisabled}
          className={`${
            saveDisabled
              ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
              : 'border-black bg-black text-white hover:bg-white hover:text-black'
          } flex h-10 w-full items-center justify-center rounded-md border text-sm transition-all focus:outline-none`}
        >
          {saving ? (
            <LoadingDots color="#808080" />
          ) : (
            <p className="text-sm">
              {Confirm_upload}
            </p>
          )}
        </button>
      )}
    </form>
  )
}
