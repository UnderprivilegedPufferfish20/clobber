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

  return (
    <div className='flex flex-col gap-8 overflow-y-scroll fullscreen p-8 min-w-0'>
      <h1 className="text-lg font-semibold">Settings</h1>
      <div className="flex flex-col gap-2 p-4 rounded-lg bg-secondary">
        <div className="flex items-center gap-2">
          <Switch 
            id="username"
            checked={signup}
            onCheckedChange={c => {
              if (c) {
                setSignup(true)
              } else {
                setSignup(false)
              }
            }}  
          />
          <Label htmlFor="username">
            Sign-Up with Username and Password
          </Label>
        </div>
        <p className="text-muted-foreground text-sm">Allow users to sign up by creating a username and password</p>
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
            Sign-In with Username and Password
          </Label>
        </div>
        <p className="text-muted-foreground text-sm">Allow users to sign in using a username and password</p>

      </div>

    </div>
  )
}

export default page