 import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
 
 interface GenerationContextType {
   generatingIds: Set<string>;
   addGenerating: (id: string) => void;
   removeGenerating: (id: string) => void;
   isGenerating: (id: string) => boolean;
   isAnyGenerating: boolean;
 }
 
 const GenerationContext = createContext<GenerationContextType | undefined>(undefined);
 
 export function GenerationProvider({ children }: { children: ReactNode }) {
   const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
 
   const addGenerating = useCallback((id: string) => {
     setGeneratingIds(prev => new Set(prev).add(id));
   }, []);
 
   const removeGenerating = useCallback((id: string) => {
     setGeneratingIds(prev => {
       const next = new Set(prev);
       next.delete(id);
       return next;
     });
   }, []);
 
   const isGenerating = useCallback((id: string) => {
     return generatingIds.has(id);
   }, [generatingIds]);
 
   const isAnyGenerating = generatingIds.size > 0;
 
   return (
     <GenerationContext.Provider value={{ 
       generatingIds, 
       addGenerating, 
       removeGenerating, 
       isGenerating, 
       isAnyGenerating 
     }}>
       {children}
     </GenerationContext.Provider>
   );
 }
 
 export function useGeneration() {
   const context = useContext(GenerationContext);
   if (!context) {
     throw new Error('useGeneration must be used within GenerationProvider');
   }
   return context;
 }