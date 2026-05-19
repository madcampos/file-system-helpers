import { describe, expect, test, vi } from 'vitest';
import { requestHandlePermissions } from './permissions.ts';

describe('requestHandlePermissions', () => {
	test('Permissions already granted', async () => {
		// oxlint-disable-next-line typescript/consistent-type-assertions, typescript/no-unsafe-type-assertion
		const handle = {
			queryPermission: vi.fn().mockResolvedValue('granted'),
			requestPermission: vi.fn()
		} as unknown as FileSystemHandle;

		await requestHandlePermissions(handle, 'read');

		expect(handle.queryPermission).toHaveBeenCalledWith({ mode: 'read' });
		expect(handle.requestPermission).not.toHaveBeenCalled();
	});

	test('New permissions are granted', async () => {
		// oxlint-disable-next-line typescript/consistent-type-assertions, typescript/no-unsafe-type-assertion
		const handle = {
			queryPermission: vi.fn().mockResolvedValue('prompt'),
			requestPermission: vi.fn().mockResolvedValue('granted')
		} as unknown as FileSystemHandle;

		await requestHandlePermissions(handle, 'read');

		expect(handle.queryPermission).toHaveBeenCalledWith({ mode: 'read' });
		expect(handle.requestPermission).toHaveBeenCalledWith({ mode: 'read' });
	});

	test('New permissions are not granted', async () => {
		// oxlint-disable-next-line typescript/consistent-type-assertions, typescript/no-unsafe-type-assertion
		const handle = {
			queryPermission: vi.fn().mockResolvedValue('prompt'),
			requestPermission: vi.fn().mockResolvedValue('denied')
		} as unknown as FileSystemHandle;

		await expect(requestHandlePermissions(handle, 'read')).rejects.toThrow('Permission to access the entry was denied');

		expect(handle.queryPermission).toHaveBeenCalledWith({ mode: 'read' });
		expect(handle.requestPermission).toHaveBeenCalledWith({ mode: 'read' });
	});
});
