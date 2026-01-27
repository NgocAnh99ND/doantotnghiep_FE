export type BaseResponse = {
    success: boolean;
    message?: string;
    mess?: string;
    error?: string;
};

// Item đúng theo ReviewRepository.getReviewsByUser()
export type ReviewDTO = {
    review_id: number;
    match_id: number;
    rating: number;
    comment: string;
    created_at: string;
};

export type ListResponse<T> =
    | { success: true; total: number; data: T[] }
    | { success: false; message?: string; mess?: string; error?: string };

export type MessageResponse =
    | { success: true; message?: string; mess?: string }
    | { success: false; message?: string; mess?: string; error?: string };

export type CreateReviewPayload = {
    match_id: number;
    user_id: number; // người được đánh giá (driver user_id theo BE của bạn)
    rating: number;  // 1..5
    comment: string; // có thể rỗng
};
