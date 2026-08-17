export const VIDEO_PEOPLE = [
  {
    id: "tiffany.lane",
    name: "Tiffany",
    handle: "tiffany.lane",
    initials: "T",
    assetPath: "assets/tiffany-profile.png"
  },
  {
    id: "emma.rose",
    name: "Emma",
    handle: "emma.rose",
    initials: "E",
    assetPath: "assets/emma-profile.png"
  },
  {
    id: "lucia.vibes",
    name: "Lucia",
    handle: "lucia.vibes",
    initials: "L",
    assetPath: "assets/lucia-profile.png"
  }
];

export function getVideoPerson(personId) {
  return VIDEO_PEOPLE.find((person) => person.id === personId) || null;
}

export function videoPeoplePayload() {
  return VIDEO_PEOPLE.map(({ id, name, handle, initials }) => ({
    id,
    name,
    handle,
    initials
  }));
}
