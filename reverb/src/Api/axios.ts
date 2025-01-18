import axios from 'axios';

const BASE_URL = 'http://localhost:8181';
const REGISTER_URL = '/account/register';
const LOGIN_URL = '/account/login';
const GET_CHANNELS = '/channel/getByServer/'
const GET_SERVERS = '/server/getByUser/'
const GET_USERBYEMAIL = '/user/getByEmail/'
const GET_USERSERVERS = '/server/getByUser/'
const GET_CHANNELMESSAGES = '/message/getByChannel/'

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
}