import axios from 'axios';

export const BASE_URL = 'http://localhost:8181';
const REGISTER_URL = '/account/register';
const LOGIN_URL = '/account/login';

const GET_CHANNELS = '/channel/getByServer/'
const GET_SERVERS = '/server/getByUser/'
const GET_USERBYEMAIL = '/user/getByEmail/'
const GET_USERSERVERS = '/server/getByUser/'
const GET_CHANNELMESSAGES = '/message/getByChannel/'

export const AVATAR_URL = '/attachment/view/'
const JOIN_SERVER = '/server/join'

const EDIT_USER = '/user/edit/'
const UPLOAD_AVATAR = '/user/avatar/'
const EDIT_SERVER = '/server/edit/'
const DELETE_SERVER = '/server/delete/'
const EDIT_CHANNEL = '/channel/edit/'
const DELETE_CHANNEL = '/channel/delete/'


export const registerUser = async (userName: string, email: string, password: string, repeatPassword: string) => {
    const response = await axios.post(
        BASE_URL+REGISTER_URL,
        JSON.stringify({
            userName: userName,
            email: email,
            password: password,
            confirmPassword: repeatPassword,
        }),
        {
            headers: {
                'Content-Type': 'application/json',
            },
        },
    );
    return response;
};

export const loginUser = async (email: string, password: string) => {
    const response = await axios.post(
        BASE_URL+LOGIN_URL,
        JSON.stringify({
            email: email,
            password: password,
        }),
        {
            headers: {
                'Content-Type': 'application/json',
            },
        },
    );
    return response;
};

export const getUserServers = async (token: string, userId: number) => {
    const response = await axios.get(
        BASE_URL+GET_USERSERVERS+userId,
        {
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            }
        },
    );
    return response;
}

export const getServer = async (token: string, serverId: string) => {
    const response = await axios.get(
        BASE_URL+GET_SERVERS+serverId,
        {
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            }
        },
    );
    return response;
};

export const getChannels = async (token: string, channelId: string) => {
    const response = await axios.get(
        BASE_URL+GET_CHANNELS+channelId,
        {
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            }
        },
    );
    return response;
};

export const getUserByEmail = async (token: string, email: string) => {
    const response = await axios.get(
        BASE_URL+GET_USERBYEMAIL+email,
        {
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            }
        },
    );
    return response;
};

export const getChannelMessages = async (token: string, channelId: number) => {
    const response = await axios.get(
        BASE_URL+GET_CHANNELMESSAGES+channelId,
        {
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            }
        },
    );
    return response;

};

export const joinServer = async (token: string, serverName: string, userId: number) => {
    // Create URLSearchParams to format data as application/x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('serverName', serverName);
    params.append('userId', userId.toString());
    console.log("Joining server with link:", BASE_URL + JOIN_SERVER + params.toString());
    const response = await axios.post(
        BASE_URL + JOIN_SERVER,
        params.toString(), // Convert to string for URL-encoded format
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${token}`,
            },
        },
    );
    return response;
};


export const editUserData = async (token: string, userId: number, userName?: string, oldPassword?: string, newPassword?: string) => {
    const response = await axios.put(
        BASE_URL + EDIT_USER + userId,
        JSON.stringify({
            userName: userName,
            oldPassword: oldPassword,
            newPassword: newPassword,
        }),
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        },
    );  
      return response;
    };

export const uploadAvatar = async (token: string, userId: number, file: File) => {
    const formData = new FormData();
        formData.append('avatar', file);
        const response = await axios.put(
            BASE_URL + UPLOAD_AVATAR + userId,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                },
            },
        );
        return response;
    };

export const editServer = async (token: string, serverId: number, serverName?: string, serverDescription?: string) => {
    const response = await axios.put(
        BASE_URL + EDIT_SERVER + serverId,
        JSON.stringify({
            serverName: serverName,
            serverDescription: serverDescription,
        }),
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        },
    );
    return response;
};

export const deleteServer = async (token: string, serverId: number) => {
    const response = await axios.delete(
        BASE_URL + DELETE_SERVER + serverId,
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        },
    );
    return response;
};

export const editChannel = async (token: string, channelId: number, channelName?: string, channelDescription?: string) => {
    const response = await axios.put(
        BASE_URL + EDIT_CHANNEL + channelId,
        JSON.stringify({
            channelName: channelName,
            channelDescription: channelDescription,
        }),
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        },
    );
    return response;
};

export const deleteChannel = async (token: string, channelId: number) => {
    const response = await axios.delete(
        BASE_URL + DELETE_CHANNEL + channelId,
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        },
    );
    return response;
};
