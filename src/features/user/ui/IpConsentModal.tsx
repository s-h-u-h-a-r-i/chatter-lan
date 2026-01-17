import { Component, createEffect, createSignal, Show } from 'solid-js';

import { TextInput } from '@/ui/inputs';
import { Modal } from '@/ui/modal';
import styles from './IpConsentModal.module.css';

type FormSubmitEvent = SubmitEvent & {
  currentTarget: HTMLFormElement;
  target: Element;
};

export const IpConsentModal: Component<{
  onConsent(): Promise<void>;
  onManualEntry(ip: string): void;
}> = (props) => {
  const [manualMode, setManualMode] = createSignal(false);
  const [manualIp, setManualIp] = createSignal('');
  const [isIpValid, setIsIpValid] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [isDetecting, setIsDetecting] = createSignal(false);

  let ipInputEl: HTMLInputElement | undefined;

  const handleAutoFetch = async () => {
    setError(null);
    setIsDetecting(true);
    try {
      await props.onConsent();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to detect IP address automatically.'
      );
    } finally {
      setIsDetecting(false);
    }
  };

  const verifyIp = (ip: string): string | null => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(ip)) {
      return 'Please enter a valid IPv4 address (e.g., 192.168.1.1)';
    }

    const octets = ip.split('.').map(Number);
    if (octets.some((octet) => isNaN(octet) || octet < 0 || octet > 255)) {
      return 'IP address octets must be between 0 and 255';
    }
    return null;
  };

  const handleManualSubmit = (e: FormSubmitEvent) => {
    e.preventDefault();
    const ip = manualIp().trim();
    const errorMsg = verifyIp(ip);
    if (errorMsg) {
      setIsIpValid(false);
      setError(errorMsg);
      return;
    }

    setIsIpValid(true);
    setError(null);
    props.onManualEntry(ip);
  };

  createEffect(() => {
    if (manualMode()) queueMicrotask(() => ipInputEl?.focus());
  });

  createEffect(() => {
    const trimmedIp = manualIp().trim();
    if (!trimmedIp) {
      setIsIpValid(false);
      setError(null);
      return;
    }
    const errorMsg = verifyIp(trimmedIp);
    if (errorMsg) {
      setIsIpValid(false);
      setError(errorMsg);
    } else {
      setIsIpValid(true);
      setError(null);
    }
  });

  return (
    <Modal
      isOpen={true}
      onClose={() => {}}
      title="Network Configuration"
      closeOnOverlayClick={false}
      closeOnEscape={false}>
      <div class={styles.content}>
        <Show
          when={!manualMode()}
          fallback={
            <form onSubmit={handleManualSubmit} class={styles.manualForm}>
              <p class={styles.description}>
                Enter your public IP address manually.
              </p>

              <div class={styles.formGroup}>
                <label for="ip-address" class={styles.label}>
                  IP Address
                </label>
                <TextInput
                  ref={ipInputEl}
                  id="ip-address"
                  name="ip-address"
                  value={manualIp()}
                  onInput={setManualIp}
                  placeholder="e.g., 192.168.1.100"
                  hasError={!!error()}
                  disabled={isDetecting()}
                />
              </div>

              <Show when={error()}>
                <div class={styles.error} aria-live="polite">
                  {error()}
                </div>
              </Show>

              <div class={styles.actions}>
                <button
                  type="button"
                  class={styles.secondaryButton}
                  onClick={() => {
                    setManualMode(false);
                    setError(null);
                  }}
                  disabled={isDetecting()}>
                  Back
                </button>
                <button
                  type="submit"
                  class={styles.primaryButton}
                  disabled={isDetecting() || !isIpValid()}>
                  {isDetecting() ? 'Detecting...' : 'Continue'}
                </button>
              </div>
            </form>
          }>
          <>
            <p class={styles.description}>
              To connect with other users on your local network, we need your IP
              address.
            </p>

            <div class={styles.options}>
              <button
                type="button"
                class={styles.primaryButton}
                onClick={handleAutoFetch}
                disabled={isDetecting()}>
                {isDetecting() ? 'Detecting...' : 'Auto-detect my IP'}
              </button>
              <button
                type="button"
                class={styles.secondaryButton}
                onClick={() => setManualMode(true)}
                disabled={isDetecting()}>
                Enter manually
              </button>
            </div>

            <Show when={error()}>
              <div class={styles.error} aria-live="polite">
                {error()}
              </div>
            </Show>

            <p class={styles.note}>
              Your IP address is only used for local network communication and
              is not shared externally.
            </p>
          </>
        </Show>
      </div>
    </Modal>
  );
};
