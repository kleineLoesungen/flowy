import type { Storage } from 'unstorage'

export default function useFileStorage(): Storage {
    const storage: Storage = useStorage('db');
    return storage;
}