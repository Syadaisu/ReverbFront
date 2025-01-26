import { AVATAR_URL, BASE_URL } from "../Api/axios";
import { FaUserCog } from "react-icons/fa";

interface ServerButtonProps {
  name: string;
  picture?: string;
}

interface UserAvatarProps {
  name?: string;
  picture?: string;
  refreshflag?: number;
}


interface IconButtonProps {
  icon: any;
  name: string;
}



export var colors = [
  "#d4ac0d",
  "#d35400",
  "#a9cce3",
  "#d7bde2",
  "#28b463",
  "#34495e",
  "#abebc6",
  "#eaecee",
  "#633974",
  "#ebdef0",
  "#17a589",
  "#2e86c1",
  "#FF5733",
  "#330045",
  "#FFC300",
  "#C70039",
  "#900C3F",
  "#581845",
  "#e6b0aa",
  "#f7dc6f",
  "#f8c471",
  "#f0b27a",
  "#85c1e9",
  "#5dade2",
  "#aed6f1",
  "#a569bd",
  "#f1948a",
  "#bb8fce",
];

export const letterToColor: { [key: string]: string } = {
  a: "#581845",
  b: "#e6b0aa",
  c: "#f7dc6f",
  d: "#f8c471",
  e: "#f0b27a",
  f: "#85c1e9",
  g: "#5dade2",
  h: "#aed6f1",
  i: "#a569bd",
  j: "#f1948a",
  k: "#bb8fce",
  l: "#d4ac0d",
  m: "#d35400",
  n: "#a9cce3",
  o: "#d7bde2",
  p: "#28b463",
  q: "#34495e",
  r: "#abebc6",
  s: "#eaecee",
  t: "#633974",
  u: "#ebdef0",
  v: "#17a589",
  w: "#2e86c1",
  x: "#FF5733",
  y: "#330045",
  z: "#FFC300",
};

export const ServerButton = ({ name, picture }: ServerButtonProps) => {
  var avatar = null;
  console.log ("picture:", picture);
  if (picture !== undefined) {
    avatar = BASE_URL+AVATAR_URL+picture;
  }
  
  return(
  <div
    className='group font-semibold relative flex items-center justify-center h-12 w-12 mt-2 mb-2 mx-auto 
    text-primary hover:rounded-xl rounded-3xl transition-all duration-300 ease-linear cursor-pointer'
    style={{
      backgroundColor: letterToColor[name[0].toLowerCase()],
    }}>
    {avatar ? (
      <picture
        className='group bg-center bg-cover w-full h-full rounded-full hover:bg-center hover:bg-cover hover:w-full hover:h-full'
        style={{ backgroundImage: `url(${avatar})` }}></picture>
    ) : (
      name[0].toUpperCase()
    )}

    <span className='group-hover:scale-100 z-50 absolute w-auto p-2 m-2 min-w-max top-11 rounded-md shadow-md text-white 
    bg-gray-900 text-xs font-bold transition-all duration-100 scale-0 origin-bottom'>
      {name}
    </span>
  </div>
);
};

export const ServerIcon = ({ name, picture }: ServerButtonProps) => {
  var avatar = null;
  if (picture !== undefined) {
    avatar = BASE_URL+AVATAR_URL+picture;
  }

  console.log("picture:",avatar, picture);
  return (
    <div
      className='group font-semibold relative flex items-center justify-center h-10 w-10 text-primary rounded-3xl duration-300'
      style={{ backgroundColor: letterToColor[name[0].toLowerCase()], }}>
      {avatar ? (
        <picture
          className='group bg-center bg-cover w-full h-full rounded-full'
          style={{ backgroundImage: `url(${avatar})` }}></picture>
      ) : (
        name ? name[0].toUpperCase() : ''
      )}
    </div>
  );
};

// technical buttons (join server, create server, etc.)
export const IconButton = ({ icon, name }: IconButtonProps) => (
  <div className='font-semibold relative flex items-center justify-center h-12 w-12 mt-2 mb-2 mx-auto bg-secondary group hover:bg-yellow-500 text-white hover:text-primary hover:rounded-xl rounded-3xl transition-all duration-300 ease-linear cursor-pointer'>
    {icon}

    <span className='group-hover:scale-100 z-50 absolute w-auto p-2 m-2 min-w-max top-11 rounded-md shadow-md text-white bg-gray-900 text-xs font-bold transition-all duration-100 scale-0 origin-left'>
      {name}
    </span>
  </div>
);

export const ChannelButton = ({ name }: { name: string }) => (
  <div className="bg-secondary hover:brightness-75 text-gray-300 font-semibold py-2 px-4 rounded-lg w-auto radius-10 justify-self-center text-left overflow-hidden  text-ellipsis   whitespace-nowrap">
    {name}
  </div>
);

// same as channel button but with dashed border
export const UserAvatar = ({ name, picture, refreshflag }: UserAvatarProps) => {
  const defaultColor = "#039be5";
  var avatar = null;
  const cacheBuster = refreshflag;
  console.log(picture);
  if (picture !== BASE_URL + AVATAR_URL + "undefined") {
    avatar = `${picture}?cb=${cacheBuster}`;
  }
  console.log(avatar);
  let backgroundColor = defaultColor;
  if (name) {
    const firstLetter = name[0].toLowerCase();
    backgroundColor = letterToColor[firstLetter] || defaultColor;
  }

  return (
    <div
      className="group relative flex items-center justify-center h-12 w-12 text-primary rounded-full transition-all duration-300 ease-linear cursor-pointer"
      style={{ backgroundColor }}
    >
      {avatar ? (
        <picture
          className="bg-center bg-cover w-full h-full rounded-full"
          style={{ backgroundImage: `url(${avatar})` }}
        ></picture>
      ) : (
        <span className="text-lg font-semibold">{name ? name[0].toUpperCase() : ''}</span>
      )}

      {/* Overlay on Hover */}
      <div className="absolute inset-0 bg-yellow-500 bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300 flex items-center justify-center rounded-full">
        {/* Cog Icon */}
        <FaUserCog className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </div>
  );
};

export const UserIcon = ({ name, picture, refreshflag }: UserAvatarProps) => {
  const defaultColor = "#039be5";
  var avatar = null;
  const cacheBuster = refreshflag;
  console.log(picture);
  if (picture !== BASE_URL + AVATAR_URL + "undefined") {
    avatar = `${picture}?cb=${cacheBuster}`;
  }
  console.log(avatar);
  let backgroundColor = defaultColor;
  if (name) {
    const firstLetter = name[0].toLowerCase();
    backgroundColor = letterToColor[firstLetter] || defaultColor;
  }

  return (
    <div
      className="group relative flex items-center justify-center h-12 w-12 text-primary rounded-full transition-all duration-300 ease-linear cursor-default"
      style={{ backgroundColor }}
    >
      {avatar ? (
        <picture
          className="bg-center bg-cover w-full h-full rounded-full"
          style={{ backgroundImage: `url(${avatar})` }}
        ></picture>
      ) : (
        <span className="text-lg font-semibold">{name ? name[0].toUpperCase() : ''}</span>
      )}
    </div>
  );
};