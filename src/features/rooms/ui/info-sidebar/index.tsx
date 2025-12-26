import { Component, JSX, Show } from 'solid-js';

import { Calendar, Hash, Info } from '@/components/icons';
import { SidebarLayout } from '@/components/ui';
import { useRoomsStore } from '../../store';
import styles from './index.module.css';

const Header: Component = (props) => (
  <>
    <Info class={styles.logo} size={20} strokeWidth={2} />
    <h2 class={styles.heading}>Room Info</h2>
  </>
);

const EmptyInfoState: Component = () => (
  <div class={styles.emptyState}>
    <div class={styles.emptyIcon}>
      <Info size={48} strokeWidth={1.5} />
    </div>
    <p>Select a room to view details</p>
  </div>
);

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
    <SidebarLayout location="right" isOpen={props.isOpen} header={<Header />}>
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
    </SidebarLayout>
  );
};
