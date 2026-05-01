/* import crypto from 'crypto';


const state = new Map();

const generateState = () => {
    const newState = crypto.randomBytes(32).toString('hex');
    state.set(newState, true);
    return newState;
}

const validateState = (stateParam) => {
    const isValid = state.get(stateParam);
    state.delete(stateParam);
    return isValid;
}

export { generateState, validateState }; */
import crypto from "crypto";

const stateStore = new Map();

const generateState = (pkceData) => {
    const newState = crypto.randomBytes(32).toString("hex");

    stateStore.set(newState, {
        ...pkceData,
        createdAt: Date.now()
    });

    return newState;
};

const getStateData = (stateParam) => {
    return stateStore.get(stateParam);
};

const deleteState = (stateParam) => {
    stateStore.delete(stateParam);
};

export { generateState, getStateData, deleteState };