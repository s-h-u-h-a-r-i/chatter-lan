import { Component, JSX, Show } from 'solid-js';

import { Calendar, Hash, Info } from '@/features/icons';
import { useRoomsStore } from '@/features/rooms';
import styles from './InfoSidebar.module.css';
import sharedStyles from './shared.module.css';

const EmptyInfoState: Component = () => {
  return (
    <div class={styles.emptyState}>
      <div class={styles.emptyIcon}>
        <Info size={48} strokeWidth={1.5} />
      </div>
      <p>Select a room to view details</p>
    </div>
  );
};

const Section: Component<{
  children: JSX.Element;
  title: string;
  icon: JSX.Element;
}> = (props) => (
  <div class={styles.section}>
    <div class={styles.sectionHeader}>
      {props.icon}
      <h3 class={styles.sectionTitle}>{props.title}</h3>
    </div>
    {props.children}
  </div>
);

export const InfoSidebar: Component<{ isOpen: boolean }> = (props) => {
  const roomsStore = useRoomsStore();

  return (
    <div
      class={`${sharedStyles.sidebar} ${sharedStyles.infoSidebar}`}
      classList={{
        [sharedStyles.open]: props.isOpen,
      }}>
      <div class={sharedStyles.header}>
        <Info class={sharedStyles.logo} size={20} strokeWidth={2} />
        <h2>Room Info</h2>
      </div>

      <Show when={roomsStore.selectedRoom} fallback={<EmptyInfoState />}>
        {(room) => (
          <div class={styles.content}>
            <Section
              title="Room Name"
              icon={
                <Hash class={styles.sectionIcon} size={16} strokeWidth={2} />
              }>
              <p>{room().name}</p>
            </Section>

            <Section
              title="Created"
              icon={
                <Calendar
                  class={styles.sectionIcon}
                  size={16}
                  strokeWidth={2}
                />
              }>
              <p>
                {room().createdAt.toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </Section>
          </div>
        )}
      </Show>
    </div>
  );
};
