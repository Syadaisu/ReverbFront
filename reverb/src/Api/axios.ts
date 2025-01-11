import axios from 'axios';

const BASE_URL = 'http://localhost:8181';
const REGISTER_URL = '/account/register';
const LOGIN_URL = '/account/login';
const GET_CHANNELS = '/channel/getByServer/'
const GET_SERVERS = '/server/getByUser/'

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