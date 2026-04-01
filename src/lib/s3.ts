import {
	type CompleteMultipartUploadCommandOutput,
	S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

export function writeToS3<T>({
	data,
	bucket,
	key,
}: {
	data: T;
	bucket: string;
	key: string;
}): Promise<CompleteMultipartUploadCommandOutput> {
	const s3 = new S3Client({});

	const upload = new Upload({
		client: s3,
		params: {
			Bucket: bucket,
			Key: key,
			Body: JSON.stringify(data),
			CacheControl: 'max-age=300',
		},
	});

	return upload.done();
}
