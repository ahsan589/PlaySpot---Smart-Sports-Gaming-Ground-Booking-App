// hooks/useOwnerAuth.ts
import { signOut } from "firebase/auth";
import { doc, getDoc, getFirestore, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { auth } from "../firebaseconfig";

interface OwnerAuth {
  approvalStatus: "pending" | "approved" | "rejected" | null;
  rejectionReason?: string;
  loading: boolean;
  user: any;
}

export const useOwnerAuth = (): OwnerAuth => {
  const [approvalStatus, setApprovalStatus] = useState<"pending" | "approved" | "rejected" | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const db = getFirestore();
    const userRef = doc(db, "users", currentUser.uid);

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.suspended) {
            await signOut(auth);
            setLoading(false);
            return;
          }
          setUser(userData);
          setApprovalStatus(userData.approvalStatus || "pending");
          setRejectionReason(userData.rejectionReason);
        }
      } catch (error) {
        console.error("Error checking owner approval:", error);
        Alert.alert("Error", "Failed to check approval status");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    const unsubscribe = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.suspended) {
          await signOut(auth);
          return;
        }
        setUser(userData);
        setApprovalStatus(userData.approvalStatus || "pending");
        setRejectionReason(userData.rejectionReason);
      }
    });

    return () => unsubscribe();
  }, []);

  return { approvalStatus, rejectionReason, loading, user };
};
