'use client';

import SheetWrapper from "@/components/SheetWrapper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { update_sso_providor } from "@/lib/actions/auth";
import { OauthSSOProvider } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { FlagIcon } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const OAuthProviderCard = (props: OauthSSOProvider) => {
  const oldvals: OauthSSOProvider = useMemo(() => {
    return {
    allow_no_email: props.allow_no_email ?? false,
    client_id: props.client_id ?? "",
    client_secret: props.client_secret ?? "",
    enabled: props.enabled,
    img_path: props.img_path,
    name: props.name, 
    project_id: props.project_id
  }
  }, [props])


  const [sheetOpen, setSheetOpen] = useState(false)

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => update_sso_providor(props.project_id, oldvals, vals),
    onMutate: () => {
      toast.loading(`Saving...`, { id: "apply-changes" })
      setSheetOpen(false)
    },
    onError: (e) => {
      toast.error(`Failed to save: ${e}`, { id: "apply-changes" })
      setVals(oldvals)
    },
    onSuccess: () => {
      toast.success("Changes applied", { id: "apply-changes" })
      // The page will revalidate and props will update with new values
    }
  })

  
  
  const [vals, setVals] = useState<OauthSSOProvider>(oldvals)
  const [idErr, setIdErr] = useState(false)
  const [secError, SetSecError] = useState(false)

  const { theme } = useTheme()

  useEffect(() => {
    if (vals.enabled) {
      if (!vals.client_id || vals.client_id.length === 0) {
        setIdErr(true)
      } else {
        setIdErr(false)
      }

      if (!vals.client_secret || vals.client_secret.length === 0) {
        SetSecError(true)
      } else {
        SetSecError(false)
      }
    } else {
      SetSecError(false)
      setIdErr(false)
    }
  }, [vals.client_secret, vals.client_id, vals.enabled])

  
  useEffect(() => {
    setVals(oldvals)
  }, [props])
  return (
    <>
      <div
        onClick={() => setSheetOpen(true)} 
        className='flex p-4 items-center justify-between dark:bg-neutral-900 rounded-md w-ms min-w-sm max-w-sm cursor-pointer shadow-md hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform duration-300'
      >
        <div className='flex items-center gap-3'>
          <Image 
            src={`${props.img_path}.png`}
            alt={props.img_path.split("/").at(-1) ?? "sso_provider"}
            width={24}
            height={24}
            className={`${theme === "dark" && (props.name === 'GitHub' || props.name === 'X / Twitter' || props.name === "Apple") ? "invert" : ""}`}
          />
          <h1 className='text-lg'>{props.name}</h1>
        </div>

      </div>


      <SheetWrapper 
        title={props.name}
        disabled={JSON.stringify(oldvals) === JSON.stringify(vals) || secError || idErr}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onDiscard={() => setVals(oldvals)}
        isDirty={() => JSON.stringify(oldvals) !== JSON.stringify(vals)}
        submitButtonText="Save"
        onSubmit={() => save()}
        bodyClassname="text-lg text-muted-foreground"
      > 
        <div className="flex items-center gap-2">
          <Switch
            id="en" 
            checked={vals.enabled}
            onCheckedChange={checked => {
              if (checked) {
                setVals(p => ({...p, enabled: true}))
              } else {
                setVals(p => ({...p, enabled: false}))
              }
            }}
          />
          <Label htmlFor="en">{props.name} enabled</Label>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="id">Client ID</Label>
          <Input 
            id="id"
            className={`${idErr && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500"} fullwidth`}
            value={vals.client_id as string}
            onChange={e => setVals(p => ({...p, client_id: e.target.value}))}
          />
          {idErr && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <FlagIcon className="stroke-red-500 w-4 h-4"/>
              Must provide client ID
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="sec">Client Secret</Label>
          <Input 
            id="sec"
            type="password"
            className={`${secError && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500"} fullwidth`}
            value={vals.client_secret as string}
            onChange={e => setVals(p => ({...p, client_secret: e.target.value}))}
          />
          {secError && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <FlagIcon className="stroke-red-500 w-4 h-4"/>
              Must provide client Secret
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="noem" 
            checked={vals.allow_no_email as boolean}
            onCheckedChange={checked => {
              if (checked) {
                setVals(p => ({...p, allow_no_email: true}))
              } else {
                setVals(p => ({...p, allow_no_email: false}))
              }
            }}
          />
          <Label htmlFor="noem">Allow users that don't provide an email</Label>
        </div>
      </SheetWrapper>


    </>
  )
}
export default OAuthProviderCard;