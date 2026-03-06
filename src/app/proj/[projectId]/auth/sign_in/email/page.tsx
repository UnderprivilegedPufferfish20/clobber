"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import CodeMirror from '@uiw/react-codemirror'
import {html} from "@codemirror/lang-html"

const page = () => {
  const [signup, setSignup] = useState(false)
  const [signupVerification, setSignupVerification] = useState(false)

  const [signin, setSignIn] = useState(false)
  const [signinVer, setSigninVer] = useState(false)

  const [emailHTM, setEmailHTM] = useState('')

  return (
    <div className='flex flex-col gap-8 overflow-y-scroll fullscreen p-8 min-w-0'>
      <h1 className="text-lg underline font-semibold">Settings</h1>
      <div className="flex flex-col gap-2 p-4 rounded-lg bg-secondary">
        <div className="flex items-center gap-2">
          <Switch 
            id="email"
            checked={signup}
            onCheckedChange={c => {
              if (c) {
                setSignup(true)
              } else {
                setSignup(false)
              }
            }}  
          />
          <Label htmlFor="email">
            Sign-Up with Email
          </Label>
        </div>
        <p className="text-muted-foreground text-sm">Allow users to sign up using an email</p>

        {signup && (
          <div className="ml-2 pl-4 pt-4 flex flex-col gap-2 border-l-4">
            <div className="flex items-center gap-2">
              <Switch 
                id="signupver"
                checked={signupVerification}
                onCheckedChange={c => {
                  if (c) {
                    setSignupVerification(true)
                  } else {
                    setSignupVerification(false)
                  }
                }}  
              />
              <Label htmlFor="signupver">
                Require verification
              </Label>
            </div>
            <p className="text-muted-foreground text-sm">Send a verification code to the email entered</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-4 rounded-lg bg-secondary">
        <div className="flex items-center gap-2">
          <Switch 
            id="signin"
            checked={signin}
            onCheckedChange={c => {
              if (c) {
                setSignIn(true)
              } else {
                setSignIn(false)
              }
            }}  
          />
          <Label htmlFor="signin">
            Sign-In with Email
          </Label>
        </div>
        <p className="text-muted-foreground text-sm">Allow users to sign in using an email</p>

        {signin && (
          <div className="ml-2 pl-4 pt-4 flex flex-col gap-2 border-l-4">
            <div className="flex items-center gap-2">
              <Switch 
                id="signinver"
                checked={signinVer}
                onCheckedChange={c => {
                  if (c) {
                    setSigninVer(true)
                  } else {
                    setSigninVer(false)
                  }
                }}  
              />
              <Label htmlFor="signinver">
                Require Confirmation
              </Label>
            </div>
            <p className="text-muted-foreground text-sm">Send a verification code to the email entered</p>
          </div>
        )}
      </div>


      <h1 className="text-lg underline font-semibold">Email View</h1>
      
      <CodeMirror 
        value={emailHTM}
        onChange={setEmailHTM}
        theme={"none"}
        extensions={[
          html()
        ]}

        className="text-sm [&_.cm-editor]:bg-background! [&_.cm-gutters]:bg-background! [&_.cm-gutters]:border-r-none!"
      />

    </div>
  )
}

export default page