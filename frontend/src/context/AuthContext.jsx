import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth'

import {
  auth,
  googleProvider,
} from '../services/firebase'

import {
  syncProfile,
} from '../services/api'


const AuthContext = createContext(null)

function getStoredPhoto(userId) {

  if (!userId) {
    return ''
  }

  try {

    return (
      localStorage.getItem(
        `profile_photo_${userId}`
      ) || ''
    )

  } catch {

    return ''

  }
}

export function AuthProvider({
  children,
}) {

  const [user, setUser] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (firebaseUser) => {

          if (!firebaseUser) {

            setUser(null)
            setLoading(false)

            return
          }

          const storedPhoto =
            getStoredPhoto(
              firebaseUser.uid
            )

          const frontendUser = {
            ...firebaseUser,
            photoURL:
              storedPhoto ||
              firebaseUser.photoURL ||
              '',
          }


          setUser(
            frontendUser
          )

          setLoading(false)

          try {

            await syncProfile()

          } catch {

          }

        }
      )


    return unsubscribe

  }, [])

  const loginWithEmail = async (
    email,
    password
  ) => {

    const result =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      )

    return result

  }

  const registerWithEmail = async (
    email,
    password
  ) => {

    const result =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )

    return result

  }

  const loginWithGoogle = async () => {

    const result =
      await signInWithPopup(
        auth,
        googleProvider
      )

    return result

  }

  const updateProfile = async ({
    displayName,
  }) => {

    if (!auth.currentUser) {

      throw new Error(
        'No authenticated user found.'
      )

    }


    const name =
      String(
        displayName || ''
      ).trim()


    if (!name) {

      throw new Error(
        'Display Name cannot be empty.'
      )

    }

    await firebaseUpdateProfile(
      auth.currentUser,
      {
        displayName: name,
      }
    )

    const updatedUser = {
      ...auth.currentUser,
      displayName: name,
      photoURL:
        getStoredPhoto(
          auth.currentUser.uid
        ) ||
        auth.currentUser.photoURL ||
        '',
    }


    setUser(
      updatedUser
    )

    try {

      await syncProfile()

    } catch {

    }


    return updatedUser

  }

  const uploadProfilePhoto = async (
    file
  ) => {

    if (!auth.currentUser) {

      throw new Error(
        'No authenticated user found.'
      )

    }


    if (!file) {

      throw new Error(
        'Please select an image.'
      )

    }


    if (
      !file.type.startsWith(
        'image/'
      )
    ) {

      throw new Error(
        'Please select a valid image file.'
      )

    }


    if (
      file.size >
      5 * 1024 * 1024
    ) {

      throw new Error(
        'Image size must be less than 5 MB.'
      )

    }

    const photoURL =
      await new Promise(
        (resolve, reject) => {

          const reader =
            new FileReader()


          reader.onload = () => {

            resolve(
              reader.result
            )

          }


          reader.onerror = () => {

            reject(
              new Error(
                'Could not read the selected image.'
              )
            )

          }


          reader.readAsDataURL(
            file
          )

        }
      )

    localStorage.setItem(
      `profile_photo_${auth.currentUser.uid}`,
      photoURL
    )

    const updatedUser = {
      ...auth.currentUser,
      displayName:
        auth.currentUser.displayName ||
        '',
      photoURL,
    }


    setUser(
      updatedUser
    )


    return updatedUser

  }

  const logout = async () => {

    await signOut(auth)

    setUser(null)

  }

  const value = {

    user,

    loading,

    loginWithEmail,

    registerWithEmail,

    loginWithGoogle,

    logout,

    updateProfile,

    uploadProfilePhoto,

  }


  return (

    <AuthContext.Provider
      value={value}
    >

      {children}

    </AuthContext.Provider>

  )

}

export function useAuth() {

  const ctx =
    useContext(
      AuthContext
    )


  if (!ctx) {

    throw new Error(
      'useAuth must be used within AuthProvider'
    )

  }


  return ctx

}