const initialState = {
    language: 'en'
};

export default ((state = initialState, action) => {
    switch (action.type) {
    case 'APP_SET_LANGUAGE':
        return {
            ...state,
            language: action.payload
        };
    default:
        return state;
    }
});