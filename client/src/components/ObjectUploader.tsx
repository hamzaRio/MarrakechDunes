import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
// CSS imports removed for build compatibility
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { getDurableObjectUrl } from "@/lib/object-upload";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: (file: { type?: string; size?: number }) => Promise<{
    method: "PUT";
    url: string;
    headers?: Record<string, string>;
    publicUrl?: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  onUpload?: (urls: string[]) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 5242880, // 5MB server policy
  onGetUploadParameters,
  onComplete,
  onUpload,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() => {
    const instance = new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
      },
      autoProceed: false,
    });
    instance.use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: async (file) => {
          const params = await onGetUploadParameters({ type: file.type, size: file.size ?? undefined });
          if (params.publicUrl) instance.setFileMeta(file.id, { publicUrl: params.publicUrl });
          return params;
        },
      });
    instance.on("complete", (result) => {
        onComplete?.(result);
        if (onUpload && result.successful) {
          const urls = result.successful.map(getDurableObjectUrl).filter((url): url is string => Boolean(url));
          onUpload(urls);
        }
        setShowModal(false);
      });
    return instance;
  });

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName}>
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
      />
    </div>
  );
}
