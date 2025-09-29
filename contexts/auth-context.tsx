"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
}

interface UserProfile {
  uid: string
  name: string
  email: string
  role: "professor"
  createdAt: Date
  examsGenerated: number
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        // Buscar perfil do usuário no Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile)
        }
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const register = async (email: string, password: string, name: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)

    // Atualizar perfil do usuário
    await updateProfile(user, { displayName: name })

    // Criar documento do usuário no Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      name,
      email,
      role: "professor",
      createdAt: new Date(),
      examsGenerated: 0,
    }

    await setDoc(doc(db, "users", user.uid), userProfile)
    setUserProfile(userProfile)
  }

  const logout = async () => {
    await signOut(auth)
  }

  const value = {
    user,
    userProfile,
    loading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
