import dbConnect from "@/lib/dbConnect";
import userModel from "@/model/userModel";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { User } from "next-auth";
import { NextRequest } from "next/server";

// export async function DELETE(
//   request: Request,
//   { params }: { params: { messageid: string } }
// ) {
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ messageid: string }> }
) {
  const { messageid } = await context.params;
  await dbConnect();

  // const messageId = params.messageid;
  const messageId = messageid;
  const session = await getServerSession(authOptions);
  const user: User = session?.user as User;

  if (!session || !session.user) {
    return Response.json(
      {
        success: false,
        message: "Not Authenticated",
      },
      { status: 401 }
    );
  }

  // const userId = new mongoose.Types.ObjectId(user._id);
  try {
    const updatedResult = await userModel.updateOne(
      { _id: user._id },
      { $pull: { messages: { _id: messageId } } }
    );

    if (updatedResult.modifiedCount === 0) {
      return Response.json(
        {
          success: false,
          message: "Message not found or already deleted",
        },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Message deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error in delete message route", error);

    return Response.json(
      {
        success: false,
        message: "Error deleting message",
      },
      { status: 500 }
    );
  }
}
