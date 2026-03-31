import { legacy_createStore as createStore } from 'redux'

const initialState = {
  sidebarShow: true,
  theme: 'light',
  loading: false,
}

const changeState = (state = initialState, { type, ...rest }) => {
  switch (type) {
    case 'set':
      return { ...state, ...rest }
    case 'set_loading':
      return { ...state, loading: rest.loading }
    default:
      return state
  }
}

const store = createStore(changeState)
export default store
