const Segments = {
  rooms: 'rooms',
  ips: 'ips',
} as const;

const fsPaths = {
  rooms: {
    path: Segments.rooms,
    ips: {
      path: `${Segments.rooms}/${Segments.ips}`,
      collection: <I extends string>(ip: I) =>
        ({
          path: `${Segments.rooms}/${Segments.ips}/${ip}`,
          doc: <R extends string>(roomId: R) =>
            ({
              path: `${Segments.rooms}/${Segments.ips}/${ip}/${roomId}`,
            } as const),
        } as const),
    },
  },
} as const;

function getRoomPath(ip: string, roomId: string) {
  return fsPaths.rooms.ips.collection(ip).doc(roomId).path;
}

export { fsPaths, getRoomPath };
