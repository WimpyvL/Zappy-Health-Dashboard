'use server';
/**
 * @fileoverview A sample flow demonstrating how to write data to Firestore.
 *
 * This flow takes a text input and writes it to a 'documents' collection in Firestore.
 */

// This flow is temporarily disabled to resolve build issues.
// We will re-enable it once the Firebase plugin is correctly configured.

import {ai} from '@/ai/genkit';
import {runFlow} from 'genkit';
import {z} from 'zod';
import {getFirestore} from 'firebase-admin/firestore';

export const sampleFirestoreFlow = ai.defineFlow(
  {
    name: 'sampleFirestoreFlow',
    inputSchema: z.object({
      text: z.string(),
    }),
    outputSchema: z.object({
      docId: z.string(),
      message: z.string(),
    }),
  },
  async (input) => {
    // const db = getFirestore();
    // const docRef = db.collection('documents').doc();

    // await docRef.set({
    //   text: input.text,
    //   createdAt: new Date().toISOString(),
    // });

    // console.log(`Document written with ID: ${docRef.id}`);

    // return {
    //   docId: docRef.id,
    //   message: 'Successfully wrote document to Firestore.',
    // };
    
    console.log('Firestore flow is temporarily disabled.');
    return {
      docId: 'disabled',
      message: 'Firestore integration is temporarily disabled.',
    };
  }
);

/**
 * A wrapper function to invoke the sampleFirestoreFlow.
 * This is the function you would call from your Next.js components.
 *
 * @param text The text content to write to the Firestore document.
 * @returns An object containing the new document ID and a success message.
 */
export async function writeDocumentToFirestore(text: string) {
  return await runFlow(sampleFirestoreFlow, {text});
}
