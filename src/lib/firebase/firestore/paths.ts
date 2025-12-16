const Segments = {
  Rooms: 'rooms',
  Ips: 'ips',
} as const;

const fsPaths = {
  rooms: {
    path: Segments.Rooms,
    ips: {
      path: `${Segments.Rooms}/${Segments.Ips}`,
      collection: <T extends string>(ip: T) =>
        ({
          path: `${Segments.Rooms}/${Segments.Ips}/${ip}`,
          doc: <R extends string>(roomId: R) =>
            ({
              path: `${Segments.Rooms}/${Segments.Ips}/${ip}/${roomId}`,
            } as const),
        } as const),
    },
  },
} as const;

export { fsPaths };
