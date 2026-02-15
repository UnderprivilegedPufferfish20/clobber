"use client";

import { OauthSSOProvider } from '@/lib/types';
import React from 'react'
import OAuthProviderCard from './OAuthProviderCard';

const AuthSignInPage = ({
  enabled_options,
  disabled_options
}: {
  enabled_options: OauthSSOProvider[],
  disabled_options: OauthSSOProvider[]
}) => {
  return (
    <div className='py-2 px-8 flex flex-col gap-4 fullscreen flex-1'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-2xl font-semibold'>Enabled</h1>
        <div className='flex gap-2 items-center flex-wrap'>
          {enabled_options.length > 0 ? (
            <>
              {enabled_options.map(p => (
                <OAuthProviderCard key={p.name} {...p}/>
              ))}
            </>
          ) : (
            <div className='flex flex-col gap-2 items-center fullwidth text-muted-foreground'>
              No enabled options
            </div>
          )}
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        <h1 className='text-2xl font-semibold'>Disabled</h1>
        <div className='flex gap-2 items-center flex-wrap'>
          {disabled_options.length > 0 ? (
            <>
              {disabled_options.map(p => (
                <OAuthProviderCard key={p.name} {...p}/>
              ))}
            </>
          ) : (
            <div className='flex flex-col gap-2 items-center fullwidth text-muted-foreground'>
              All options enabled
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthSignInPage