from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.core.storage import s3_client
from app.api.v1.deps import get_current_user

router = APIRouter()


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...), current_user: dict = Depends(get_current_user)
):
    """
    Upload an image to object storage.
    Only authenticated users can upload.
    """
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(
            400, detail="Invalid file type. Only JPEG, PNG, WEBP allowed."
        )

    try:
        url = s3_client.upload_file(file.file, file.content_type)
        return {"url": url}
    except Exception as e:
        raise HTTPException(500, detail=f"Image upload failed: {str(e)}")
